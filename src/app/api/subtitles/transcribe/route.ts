import { promises as fs } from 'node:fs';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { transcribe } from 'tafrigh';
import type { SubtitleEntry } from '@/types';

const convertToSrtTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

const convertToSrt = (entries: SubtitleEntry[]): string => {
    return entries
        .map(
            (entry) =>
                `${entry.index}\n${convertToSrtTime(entry.startTime)} --> ${convertToSrtTime(entry.endTime)}\n${entry.text}\n`,
        )
        .join('\n');
};

// Punctuation that marks sentence boundaries
const SENTENCE_ENDINGS = /[.!?]+$/;

const groupTokensIntoSubtitles = (
    segments: Array<{
        start: number;
        end: number;
        text: string;
        tokens?: Array<{ start: number; end: number; text: string }>;
    }>,
): SubtitleEntry[] => {
    const subtitles: SubtitleEntry[] = [];
    let index = 1;

    for (const segment of segments) {
        // If no tokens available, fall back to using the segment as-is
        if (!segment.tokens || segment.tokens.length === 0) {
            subtitles.push({
                endTime: segment.end,
                index: index++,
                startTime: segment.start,
                text: segment.text.trim(),
            });
            continue;
        }

        // Group tokens into sentences based on punctuation
        let currentStart = segment.tokens[0].start;
        let currentWords: string[] = [];

        for (let i = 0; i < segment.tokens.length; i++) {
            const token = segment.tokens[i];
            currentWords.push(token.text);

            // Check if this token ends with sentence-ending punctuation
            // or if it's the last token in the segment
            const endsWithPunctuation = SENTENCE_ENDINGS.test(token.text.trim());
            const isLastToken = i === segment.tokens.length - 1;

            if (endsWithPunctuation || isLastToken) {
                const text = currentWords.join(' ').trim();

                if (text) {
                    subtitles.push({ endTime: token.end, index: index++, startTime: currentStart, text });
                }

                // Start a new sentence if there are more tokens
                if (i < segment.tokens.length - 1) {
                    currentStart = segment.tokens[i + 1].start;
                    currentWords = [];
                }
            }
        }
    }

    return subtitles;
};

export const POST = async (req: NextRequest) => {
    try {
        const { videoPath }: { videoPath: string } = await req.json();

        if (!videoPath) {
            return NextResponse.json({ error: 'Video path is required' }, { status: 400 });
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                const heartbeat = setInterval(() => {
                    controller.enqueue(encoder.encode(': keep-alive\n\n'));
                }, 15000);

                try {
                    send({ message: 'Preparing video for transcription...', status: 'preprocessing' });

                    let totalChunks = 0;
                    let processedChunks = 0;

                    const segments = await transcribe(videoPath, {
                        callbacks: {
                            onPreprocessingFinished: async () => {
                                send({ message: 'Pre-processing complete', status: 'preprocessing' });
                            },
                            onPreprocessingStarted: async () => {
                                send({ message: 'Starting pre-processing...', status: 'preprocessing' });
                            },
                            onTranscriptionFinished: async (transcripts) => {
                                send({
                                    message: `Transcription complete - ${transcripts.length} segments processed`,
                                    status: 'transcribing',
                                });
                            },
                            onTranscriptionProgress: (index) => {
                                processedChunks = index;
                                const progress =
                                    totalChunks > 0 ? Math.round((processedChunks / totalChunks) * 100) : 0;
                                send({
                                    message: `Processing chunk ${index} of ${totalChunks}`,
                                    progress,
                                    status: 'transcribing',
                                });
                            },
                            onTranscriptionStarted: async (total) => {
                                totalChunks = total;
                                send({
                                    message: `Starting transcription of ${total} chunks...`,
                                    status: 'transcribing',
                                    total,
                                });
                            },
                        },
                        concurrency: 5,
                        retries: 3,
                        splitOptions: { chunkDuration: 300 },
                    });

                    // Convert segments with tokens into properly split subtitles
                    const subtitles = groupTokensIntoSubtitles(segments);

                    // Save as SRT file next to the video
                    const srtPath = videoPath.replace(/\.[^.]+$/, '.srt');
                    const srtContent = convertToSrt(subtitles);
                    await fs.writeFile(srtPath, srtContent, 'utf-8');

                    send({ complete: true, message: 'Transcription saved successfully', srtPath, subtitles });
                } catch (error) {
                    send({ error: error instanceof Error ? error.message : 'Transcription failed' });
                } finally {
                    clearInterval(heartbeat);
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Content-Type': 'text/event-stream' },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to start transcription' }, { status: 500 });
    }
};
