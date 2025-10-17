import { useEffect, useState } from 'react';

export const useVideoRemount = (videoPath: string, delayMs = 100) => {
    const [showVideo, setShowVideo] = useState(true);

    // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally depend only on `videoPath` to trigger a remount cycle
    useEffect(() => {
        setShowVideo(false);
        const timer = setTimeout(() => setShowVideo(true), delayMs);
        return () => clearTimeout(timer);
    }, [videoPath, delayMs]);

    return showVideo;
};
