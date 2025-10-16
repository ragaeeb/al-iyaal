import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatTime, parseTimeToSeconds } from '@/lib/srtParsing';

type VideoControlsProps = {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    onTogglePlayPause: () => void;
    onSkipTime: (seconds: number) => void;
    onSeek: (time: number) => void;
};

export const VideoControls = memo<VideoControlsProps>(
    ({ isPlaying, currentTime, duration, onTogglePlayPause, onSkipTime, onSeek }) => {
        const [isDragging, setIsDragging] = useState(false);
        const [timeInput, setTimeInput] = useState('');

        const progressPercent = (currentTime / duration) * 100 || 0;
        const currentTimeFormatted = formatTime(currentTime);
        const durationFormatted = formatTime(duration);

        const handleSeek = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const newTime = pos * duration;
                onSeek(newTime);
            },
            [duration, onSeek],
        );

        const handleMouseDown = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                setIsDragging(true);
                handleSeek(e);
            },
            [handleSeek],
        );

        const handleMouseUp = useCallback(() => {
            setIsDragging(false);
        }, []);

        const handleMouseMove = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                if (isDragging) {
                    handleSeek(e);
                }
            },
            [isDragging, handleSeek],
        );

        const handleTimeInputChange = useCallback(
            (value: string) => {
                setTimeInput(value);
                const match = value.match(/^(\d{1,2}):(\d{2}):(\d{2})$|^(\d{1,2}):(\d{2})$/);
                if (match) {
                    const seconds = parseTimeToSeconds(value);
                    if (seconds <= duration) {
                        onSeek(seconds);
                    }
                }
            },
            [duration, onSeek],
        );

        return (
            <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Button
                        size="icon"
                        onClick={() => onSkipTime(-5)}
                        className="h-9 w-9 flex-shrink-0 bg-slate-700 hover:bg-slate-600"
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        onClick={onTogglePlayPause}
                        className="h-9 w-9 flex-shrink-0 bg-blue-600 hover:bg-blue-700"
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                    </Button>

                    <Button
                        size="icon"
                        onClick={() => onSkipTime(5)}
                        className="h-9 w-9 flex-shrink-0 bg-slate-700 hover:bg-slate-600"
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>

                    <div className="flex-1">
                        <div
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseUp}
                            role="slider"
                            tabIndex={0}
                            aria-label="Video progress"
                            aria-valuemin={0}
                            aria-valuemax={duration}
                            aria-valuenow={currentTime}
                            className="group relative h-2 cursor-pointer rounded-full bg-slate-700"
                        >
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                            <div
                                className="-translate-y-1/2 absolute top-1/2 h-4 w-4 rounded-full bg-white shadow-lg transition-transform group-hover:scale-125"
                                style={{ left: `calc(${progressPercent}% - 8px)` }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2">
                        <Input
                            value={timeInput || currentTimeFormatted}
                            onChange={(e) => handleTimeInputChange(e.target.value)}
                            onFocus={() => setTimeInput(currentTimeFormatted)}
                            onBlur={() => setTimeInput('')}
                            className="h-8 w-24 border-slate-700 bg-slate-800 px-2 text-center text-slate-400 text-xs tabular-nums"
                        />
                        <span className="text-slate-500 text-xs">/</span>
                        <span className="text-slate-400 text-xs tabular-nums">{durationFormatted}</span>
                    </div>
                </div>
            </div>
        );
    },
);

VideoControls.displayName = 'VideoControls';
