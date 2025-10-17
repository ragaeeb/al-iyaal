import { promises as fs } from 'node:fs';
import path from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';
import { VIDEO_EXTENSIONS } from '@/lib/constants';
import { type ProbeResult, probeMany } from '@/lib/probePool';
import { formatDuration, formatSize } from '@/lib/textUtils';
import type { VideoFile } from '@/types';

const mapProbedResultsToVideoFiles = (probed: ProbeResult[], subtitleBasenames: Set<string>): VideoFile[] => {
    return probed.map((p) => {
        const name = path.basename(p.path);
        const nameWithoutExt = path.basename(p.path, path.extname(p.path));

        const subtitlePath = subtitleBasenames.has(nameWithoutExt) ? p.path.replace(/\.[^.]+$/, '.srt') : undefined;

        if (p.ok) {
            return {
                duration: formatDuration(p.durationSec),
                name,
                path: p.path,
                size: formatSize(p.sizeByte),
                ...(subtitlePath && { subtitlePath }),
            };
        } else {
            console.error(`Probe failed for ${name}: ${p.error}`);
            return { duration: '—', name, path: p.path, size: '—', ...(subtitlePath && { subtitlePath }) };
        }
    });
};

export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const folderPath = searchParams.get('path');

        if (!folderPath) {
            return NextResponse.json({ error: 'Folder path is required' }, { status: 400 });
        }

        const files = await fs.readdir(folderPath);

        const srtBaseNames = new Set(
            files.filter((f) => path.extname(f).toLowerCase() === '.srt').map((f) => path.basename(f, '.srt')),
        );

        // Build absolute paths for candidate videos
        const videoPaths = files
            .filter((f) => VIDEO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
            .map((f) => path.join(folderPath, f));

        // Probe durations concurrently (bounded)
        const probed = await probeMany(videoPaths);

        // Build response objects (size comes from probe result now!)
        const videoFiles = mapProbedResultsToVideoFiles(probed, srtBaseNames);

        return NextResponse.json({ videos: videoFiles });
    } catch (error) {
        console.error('Error listing videos:', error);
        return NextResponse.json({ error: 'Failed to list videos' }, { status: 500 });
    }
};
