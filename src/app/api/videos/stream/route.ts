import { createReadStream, statSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { type NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const videoPath = searchParams.get('path');

    if (!videoPath) {
        return new NextResponse('Video path is required', { status: 400 });
    }

    try {
        const fileStats = statSync(videoPath);
        const fileSize = fileStats.size;
        const range = req.headers.get('range');

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            const stream = createReadStream(videoPath, { end, start });

            return new NextResponse(stream as any, {
                headers: {
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize.toString(),
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Content-Type': 'video/mp4',
                },
                status: 206,
            });
        } else {
            const stream = createReadStream(videoPath);

            return new NextResponse(stream as any, {
                headers: { 'Content-Length': fileSize.toString(), 'Content-Type': 'video/mp4' },
            });
        }
    } catch (error) {
        return new NextResponse('Video not found', { status: 404 });
    }
};
