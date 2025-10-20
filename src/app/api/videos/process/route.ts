import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { FFmpeggy } from '@/lib/ffmpegConfig';
import type { VideoQuality } from '@/types';

type TimeRange = { start: string; end: string };

const parseTimeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    let seconds = 0;
    let multiplier = 1;

    for (let i = parts.length - 1; i >= 0; i--) {
        seconds += parts[i] * multiplier;
        multiplier *= 60;
    }

    return seconds;
};

const getQualityOptions = (quality: VideoQuality): string[] => {
    switch (quality) {
        case 'passthrough':
            return ['-c copy'];
        case 'high':
            return [
                '-c:v libx264',
                '-preset medium',
                '-crf 20',
                '-b:v 5000k',
                '-maxrate 6000k',
                '-bufsize 12000k',
                '-c:a aac',
                '-b:a 192k',
            ];
        case 'medium':
            return [
                '-c:v libx264',
                '-preset medium',
                '-crf 23',
                '-b:v 2500k',
                '-maxrate 3000k',
                '-bufsize 6000k',
                '-c:a aac',
                '-b:a 128k',
            ];
        case 'low':
            return [
                '-c:v libx264',
                '-preset fast',
                '-crf 26',
                '-b:v 1000k',
                '-maxrate 1200k',
                '-bufsize 2400k',
                '-c:a aac',
                '-b:a 96k',
            ];
        case 'ultralow':
            return [
                '-c:v libx264',
                '-preset fast',
                '-crf 28',
                '-b:v 500k',
                '-maxrate 600k',
                '-bufsize 1200k',
                '-c:a aac',
                '-b:a 64k',
            ];
    }
};

export const POST = async (req: NextRequest) => {
    const {
        path: videoPath,
        ranges,
        quality,
    }: { path: string; ranges: TimeRange[]; quality: VideoQuality } = await req.json();

    if (!videoPath || !ranges || ranges.length === 0) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!quality || !['passthrough', 'high', 'medium', 'low', 'ultralow'].includes(quality)) {
        return NextResponse.json({ error: 'Invalid quality parameter' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                const tempDir = path.join(os.tmpdir(), `video-edit-${Date.now()}`);
                await fs.mkdir(tempDir, { recursive: true });

                const slicedPaths: string[] = [];
                const totalRanges = ranges.length;
                const qualityOptions = getQualityOptions(quality);

                for (let i = 0; i < ranges.length; i++) {
                    const range = ranges[i];
                    const start = parseTimeToSeconds(range.start);
                    const end = parseTimeToSeconds(range.end);
                    const duration = end - start;
                    const outputPath = path.join(tempDir, `slice-${i}.mp4`);

                    const ffmpeg = new FFmpeggy();
                    ffmpeg
                        .setInput(videoPath)
                        .setInputOptions([`-ss ${start}`])
                        .setOutputOptions([...qualityOptions, `-t ${duration}`])
                        .setOutput(outputPath);

                    await ffmpeg.run();
                    await ffmpeg.done();

                    const overallProgress = Math.round(((i + 1) / totalRanges) * 90);
                    send({ progress: overallProgress });

                    slicedPaths.push(outputPath);
                }

                const fileName = path.basename(videoPath, path.extname(videoPath));
                const qualitySuffix = quality === 'passthrough' ? '_original' : quality === 'high' ? '' : `_${quality}`;
                const outputPath = path.join(
                    path.dirname(videoPath),
                    `${fileName}_edited${qualitySuffix}_${Date.now()}${path.extname(videoPath)}`,
                );

                if (slicedPaths.length === 1) {
                    await fs.rename(slicedPaths[0], outputPath);
                    send({ complete: true, outputPath, progress: 100 });
                } else {
                    const concatFilePath = path.join(tempDir, 'concat.txt');
                    const concatContent = slicedPaths.map((p) => `file '${p}'`).join('\n');
                    await fs.writeFile(concatFilePath, concatContent);

                    const ffmpeg = new FFmpeggy();
                    ffmpeg
                        .setInput(concatFilePath)
                        .setInputOptions(['-f concat', '-safe 0'])
                        .setOutputOptions(['-c copy'])
                        .setOutput(outputPath);

                    await ffmpeg.run();
                    await ffmpeg.done();

                    send({ complete: true, outputPath, progress: 100 });
                }

                await fs.rm(tempDir, { recursive: true });
            } catch (error) {
                send({ error: error instanceof Error ? error.message : 'Processing failed' });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: { 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Content-Type': 'text/event-stream' },
    });
};
