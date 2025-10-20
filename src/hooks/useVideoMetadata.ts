import path from 'node:path';
import { useEffect, useMemo, useState } from 'react';

type VideoMetadata = { duration: string; size: string; path: string; name: string };

export const useVideoMetadata = (videoPath: string) => {
    const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const videoName = useMemo(() => path.basename(videoPath), [videoPath]);

    useEffect(() => {
        if (videoName) {
            document.title = videoName;
        }
        return () => {
            document.title = 'al-Iyāl';
        };
    }, [videoName]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchMetadata = async () => {
            if (!videoPath) {
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const response = await fetch(`/api/videos?path=${encodeURIComponent(videoPath)}`, {
                    signal: controller.signal,
                });

                if (response.ok) {
                    const data = await response.json();
                    if (!controller.signal.aborted) {
                        setMetadata(data);
                    }
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Failed to fetch video metadata:', error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchMetadata();

        return () => controller.abort();
    }, [videoPath]);

    return { loading, metadata };
};
