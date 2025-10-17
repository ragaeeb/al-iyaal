import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatTime, parseTimeToSeconds } from '@/lib/textUtils';
import { MagneticBackgroundButton } from './cuicui/magnetic-background-button';
import { SimpleModernSlider } from './cuicui/simple-modern-slider';

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
        const [timeInput, setTimeInput] = useState('');

        const currentTimeFormatted = formatTime(currentTime, duration);
        const durationFormatted = formatTime(duration, duration);

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
                    <div className="flex h-8 items-center gap-2 overflow-hidden rounded-lg border border-neutral-400/10 bg-neutral-400/10 p-1">
                        <MagneticBackgroundButton
                            onClick={() => onSkipTime(-5)}
                            className="h-6 flex-col gap-1 px-2 py-1"
                        >
                            <SkipBack className="size-4 text-neutral-400" />
                        </MagneticBackgroundButton>
                        <MagneticBackgroundButton onClick={onTogglePlayPause} className="h-6 flex-col gap-1 px-2 py-1">
                            {isPlaying ? (
                                <Pause className="size-4 text-neutral-400" />
                            ) : (
                                <Play className="size-4 text-neutral-400" />
                            )}
                        </MagneticBackgroundButton>
                        <MagneticBackgroundButton
                            onClick={() => onSkipTime(5)}
                            className="h-6 flex-col gap-1 px-2 py-1"
                        >
                            <SkipForward className="size-4 text-neutral-400" />
                        </MagneticBackgroundButton>
                    </div>

                    <SimpleModernSlider value={currentTime} max={duration} onChange={onSeek} className="h-8" />

                    <div className="flex h-8 flex-shrink-0 items-center gap-2">
                        <Input
                            value={timeInput || currentTimeFormatted}
                            onChange={(e) => handleTimeInputChange(e.target.value)}
                            onFocus={() => setTimeInput(currentTimeFormatted)}
                            onBlur={() => setTimeInput('')}
                            className="h-full w-20 border-slate-700 bg-slate-800 px-2 text-center text-slate-400 text-xs tabular-nums"
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
