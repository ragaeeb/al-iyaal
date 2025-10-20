import type { TimeRange } from '@/types';

const STORAGE_KEY_PREFIX = 'video_ranges_';

export const saveTimeRanges = (videoPath: string, ranges: TimeRange[]): void => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${videoPath}`;
        localStorage.setItem(key, JSON.stringify(ranges));
    } catch (error) {
        console.error('Failed to save time ranges:', error);
    }
};

export const loadTimeRanges = (videoPath: string): TimeRange[] => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${videoPath}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored) as TimeRange[];
        }
    } catch (error) {
        console.error('Failed to load time ranges:', error);
    }
    return [];
};

export const clearTimeRanges = (videoPath: string): void => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${videoPath}`;
        localStorage.remove(key);
    } catch (error) {
        console.error('Failed to clear time ranges:', error);
    }
};
