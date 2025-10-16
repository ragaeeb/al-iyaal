import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import { type NextRequest, NextResponse } from 'next/server';

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

const sliceVideo = (
    inputPath: string,
    outputPath: string,
    start: number,
    end: number,
    onProgress: (percent: number) => void,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .inputOptions([`-ss ${start}`])
            .outputOptions(['-c:v libx264', '-c:a aac', '-strict -2', `-threads ${os.cpus().length}`])
            .duration(end - start)
            .output(outputPath)
            .on('progress', (progress) => {
                if (progress.percent) {
                    onProgress(Math.round(progress.percent));
                }
            })
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
};

const mergeVideos = (
    inputPaths: string[],
    outputPath: string,
    onProgress: (percent: number) => void,
): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const listFilePath = path.join(os.tmpdir(), `merge-${Date.now()}.txt`);
        const listContent = inputPaths.map((p) => `file '${p}'`).join('\n');
        await fs.writeFile(listFilePath, listContent);

        ffmpeg()
            .input(listFilePath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy', `-threads ${os.cpus().length}`])
            .output(outputPath)
            .on('progress', (progress) => {
                if (progress.percent) {
                    onProgress(Math.round(progress.percent));
                }
            })
            .on('end', async () => {
                await fs.unlink(listFilePath);
                resolve();
            })
            .on('error', async (err) => {
                await fs.unlink(listFilePath);
                reject(err);
            })
            .run();
    });
};

export const POST = async (req: NextRequest) => {
    const { path: videoPath, ranges }: { path: string; ranges: TimeRange[] } = await req.json();

    if (!videoPath || !ranges || ranges.length === 0) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
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

                for (let i = 0; i < ranges.length; i++) {
                    const range = ranges[i];
                    const start = parseTimeToSeconds(range.start);
                    const end = parseTimeToSeconds(range.end);
                    const outputPath = path.join(tempDir, `slice-${i}.mp4`);

                    await sliceVideo(videoPath, outputPath, start, end, (percent) => {
                        const overallProgress = Math.round(
                            (i / totalRanges) * 100 + (percent / 100) * (100 / totalRanges),
                        );
                        send({ progress: overallProgress });
                    });

                    slicedPaths.push(outputPath);
                }

                const fileName = path.basename(videoPath, path.extname(videoPath));
                const outputPath = path.join(
                    path.dirname(videoPath),
                    `${fileName}_edited_${Date.now()}${path.extname(videoPath)}`,
                );

                if (slicedPaths.length === 1) {
                    await fs.rename(slicedPaths[0], outputPath);
                    send({ complete: true, outputPath, progress: 100 });
                } else {
                    await mergeVideos(slicedPaths, outputPath, (percent) => {
                        const mergeProgress = Math.round(90 + (percent / 100) * 10);
                        send({ progress: mergeProgress });
                    });
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
