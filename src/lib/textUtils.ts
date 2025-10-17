import type { SubtitleEntry } from '@/types';
import { FILE_SIZE_UNITS, SRT_TIME_PATTERN } from './constants';

export const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatSize = (bytes: number) => {
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${FILE_SIZE_UNITS[unitIndex]}`;
};

export const formatTime = (seconds: number, maxDuration?: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const showHours = (maxDuration ?? seconds) >= 3600;

    if (showHours) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const parseTimeToSeconds = (time: string) => {
    const parts = time.split(':').map(Number);
    let seconds = 0;
    let multiplier = 1;

    for (let i = parts.length - 1; i >= 0; i--) {
        seconds += parts[i] * multiplier;
        multiplier *= 60;
    }

    return seconds;
};

export const parseSrtTime = (timeString: string) => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split(',');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1], 10);

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

export const parseSrt = (content: string) => {
    const blocks = content.trim().split('\n\n');
    const subtitles: SubtitleEntry[] = [];

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const index = parseInt(lines[0], 10);
            const timeLine = lines[1];
            const text = lines.slice(2).join('\n');

            const timeMatch = timeLine.match(SRT_TIME_PATTERN);
            if (timeMatch) {
                subtitles.push({
                    endTime: parseSrtTime(timeMatch[2]),
                    index,
                    startTime: parseSrtTime(timeMatch[1]),
                    text,
                });
            }
        }
    }

    return subtitles;
};
