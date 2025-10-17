import { memo } from 'react';
import type { SubtitleEntry } from '@/types';

type VideoPlayerProps = {
    videoPath: string;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    currentSubtitle: SubtitleEntry | undefined;
    onLoadedMetadata: () => void;
    onTimeUpdate: () => void;
    onPlay: () => void;
    onPause: () => void;
    showVideo: boolean;
};

export const VideoPlayer = memo<VideoPlayerProps>(
    ({ videoPath, videoRef, currentSubtitle, onLoadedMetadata, onTimeUpdate, onPlay, onPause, showVideo }) => {
        if (!showVideo) {
            return (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-black">
                    <p className="text-slate-400 text-sm">Loading video...</p>
                </div>
            );
        }

        return (
            <div className="relative">
                <video
                    ref={videoRef}
                    src={`/api/videos/stream?path=${encodeURIComponent(videoPath)}`}
                    onLoadedMetadata={onLoadedMetadata}
                    playsInline
                    preload="metadata"
                    onTimeUpdate={onTimeUpdate}
                    onPlay={onPlay}
                    onPause={onPause}
                    className="w-full rounded-lg bg-black"
                >
                    <track kind="captions" />
                </video>
                {currentSubtitle && (
                    <div className="absolute right-0 bottom-8 left-0 flex justify-center px-4">
                        <div className="max-w-[90%] whitespace-pre-wrap rounded-lg bg-black/80 px-4 py-2 text-center font-medium text-white text-xl leading-relaxed shadow-lg">
                            {currentSubtitle.text}
                        </div>
                    </div>
                )}
            </div>
        );
    },
);

VideoPlayer.displayName = 'VideoPlayer';
