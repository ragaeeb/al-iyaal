import { useCallback, useRef, useState } from 'react';

export const useVideoPlayer = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    }, []);

    const togglePlayPause = useCallback(async () => {
        if (videoRef.current) {
            try {
                if (videoRef.current.paused) {
                    await videoRef.current.play();
                } else {
                    videoRef.current.pause();
                }
            } catch (error) {
                console.error('Play/Pause failed:', error);
            }
        }
    }, []);

    const skipTime = useCallback(
        (seconds: number) => {
            if (videoRef.current) {
                const total = Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : duration;
                const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, total));

                videoRef.current.currentTime = newTime;
                setCurrentTime(newTime);
            }
        },
        [duration],
    );

    const seekTo = useCallback((time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    return {
        currentTime,
        duration,
        handleLoadedMetadata,
        handleTimeUpdate,
        isPlaying,
        seekTo,
        setIsPlaying,
        skipTime,
        togglePlayPause,
        videoRef,
    };
};
