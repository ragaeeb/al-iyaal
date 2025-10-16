export const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const parseTimeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    let seconds = 0;
    let multiplier = 1;

    for (let i = parts.length - 1; i >= 0; i--) {
        seconds += parts[i] * multiplier;
        multiplier *= 60;
    }

    return seconds;
};

export const parseSrtTime = (timeString: string): number => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const secondsParts = parts[2].split(',');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = parseInt(secondsParts[1], 10);

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

export const parseSrt = (
    content: string,
): Array<{ index: number; startTime: number; endTime: number; text: string }> => {
    const blocks = content.trim().split('\n\n');
    const subtitles: Array<{ index: number; startTime: number; endTime: number; text: string }> = [];

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const index = parseInt(lines[0], 10);
            const timeLine = lines[1];
            const text = lines.slice(2).join('\n');

            const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
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
