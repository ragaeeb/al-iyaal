import { useEffect, useState } from 'react';

export const useVideoRemount = (videoPath: string) => {
    const [showVideo, setShowVideo] = useState(true);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        setShowVideo(false);
        const timer = setTimeout(() => setShowVideo(true), 100);
        return () => clearTimeout(timer);
    }, [videoPath]);

    return showVideo;
};
