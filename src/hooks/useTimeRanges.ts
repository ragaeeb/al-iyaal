import { useCallback, useEffect, useState } from 'react';
import { parseTimeToSeconds } from '@/lib/textUtils';
import { loadTimeRanges, saveTimeRanges } from '@/lib/timeRangesStorage';
import type { TimeRange } from '@/types';

export const useTimeRanges = (videoPath: string) => {
    const [ranges, setRanges] = useState<TimeRange[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (videoPath && !loaded) {
            const savedRanges = loadTimeRanges(videoPath);
            if (savedRanges.length > 0) {
                setRanges(savedRanges);
            }
            setLoaded(true);
        }
    }, [videoPath, loaded]);

    useEffect(() => {
        if (loaded && videoPath) {
            saveTimeRanges(videoPath, ranges);
        }
    }, [ranges, videoPath, loaded]);

    const addRange = useCallback((range: TimeRange) => {
        setRanges((prev) =>
            [...prev, range].toSorted((a, b) => parseTimeToSeconds(a.start) - parseTimeToSeconds(b.start)),
        );
    }, []);

    const removeRange = useCallback((range: TimeRange) => {
        setRanges((prev) => prev.filter((r) => r !== range));
    }, []);

    return { addRange, ranges, removeRange };
};
