import { promises as fs } from 'node:fs';
import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import { type NextRequest, NextResponse } from 'next/server';

type VideoFile = { name: string; path: string; duration: string; size: string };

const getVideoDuration = (filePath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata.format.duration || 0);
            }
        });
    });
};

const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
};

const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const POST = async (req: NextRequest) => {
    try {
        const { folderPath } = await req.json();

        if (!folderPath) {
            return NextResponse.json({ error: 'Folder path is required' }, { status: 400 });
        }

        const files = await fs.readdir(folderPath);
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];

        const videoFiles: VideoFile[] = [];

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (videoExtensions.includes(ext)) {
                const filePath = path.join(folderPath, file);
                const stats = await fs.stat(filePath);

                try {
                    const duration = await getVideoDuration(filePath);
                    videoFiles.push({
                        duration: formatDuration(duration),
                        name: file,
                        path: filePath,
                        size: formatSize(stats.size),
                    });
                } catch (error) {
                    console.error(`Error getting metadata for ${file}:`, error);
                }
            }
        }

        return NextResponse.json({ videos: videoFiles });
    } catch (error) {
        console.error('Error listing videos:', error);
        return NextResponse.json({ error: 'Failed to list videos' }, { status: 500 });
    }
};
