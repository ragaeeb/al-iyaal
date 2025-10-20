import { type NextRequest, NextResponse } from 'next/server';
import { type ProbeResult, probeMany } from '@/lib/probePool';
import { formatDuration, formatSize } from '@/lib/textUtils';
import type { VideoFile } from '@/types';

export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const videoPath = searchParams.get('path');

        if (!videoPath) {
            return NextResponse.json({ error: 'Video path is required' }, { status: 400 });
        }

        const probed: ProbeResult[] = await probeMany([videoPath]);
        const result = probed[0];

        if (!result) {
            return NextResponse.json({ error: 'Failed to probe video' }, { status: 500 });
        }

        if (result.ok) {
            const videoFile: Omit<VideoFile, 'name' | 'subtitlePath'> = {
                duration: formatDuration(result.durationSec),
                path: result.path,
                size: formatSize(result.sizeByte),
            };
            return NextResponse.json(videoFile);
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error('Error getting video metadata:', error);
        return NextResponse.json({ error: 'Failed to get video metadata' }, { status: 500 });
    }
};
