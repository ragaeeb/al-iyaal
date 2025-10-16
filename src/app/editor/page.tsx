'use client';

import { ArrowLeft, Pause, Play, Plus, Scissors, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

type TimeRange = { start: string; end: string };

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const parseTimeToSeconds = (time: string): number => {
    const parts = time.split(':').map(Number);
    let seconds = 0;
    let multiplier = 1;

    for (let i = parts.length - 1; i >= 0; i--) {
        seconds += parts[i] * multiplier;
        multiplier *= 60;
    }

    return seconds;
};

const EditorPage = () => {
    const searchParams = useSearchParams();
    const videoPath = searchParams.get('path') || '';
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [ranges, setRanges] = useState<TimeRange[]>([]);
    const [rangeInput, setRangeInput] = useState('');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

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
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                try {
                    await videoRef.current.play();
                } catch (error) {
                    console.error('Play failed:', error);
                }
            }
        }
    }, [isPlaying]);

    const handleSeek = useCallback(
        (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
            if (!videoRef.current) {
                return;
            }
            if ('key' in e && e.key !== 'Enter' && e.key !== ' ') {
                return;
            }

            const rect = e.currentTarget.getBoundingClientRect();
            const pos = ((e as React.MouseEvent).clientX - rect.left) / rect.width;
            const newTime = pos * duration;
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        },
        [duration],
    );

    const addRange = useCallback(() => {
        const match = rangeInput.match(/^(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})-(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})$/);
        if (match) {
            setRanges((prev) => [...prev, { end: match[2], start: match[1] }]);
            setRangeInput('');
        }
    }, [rangeInput]);

    const handleScissorsClick = useCallback(() => {
        const currentFormatted = formatTime(currentTime);

        if (!rangeInput.trim()) {
            setRangeInput(currentFormatted);
        } else if (!rangeInput.includes('-')) {
            const newRange = `${rangeInput}-${currentFormatted}`;
            const match = newRange.match(/^(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})-(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})$/);
            if (match) {
                setRanges((prev) => [...prev, { end: match[2], start: match[1] }]);
                setRangeInput('');
            }
        }
    }, [currentTime, rangeInput]);

    const seekToRange = useCallback((range: TimeRange) => {
        const startSeconds = parseTimeToSeconds(range.start);
        if (videoRef.current) {
            videoRef.current.currentTime = startSeconds;
            setCurrentTime(startSeconds);
        }
    }, []);

    const handleProcess = useCallback(async () => {
        if (ranges.length === 0) {
            toast.error('Please add at least one time range');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const response = await fetch('/api/videos/process', {
                body: JSON.stringify({ path: videoPath, ranges }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to start processing');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));

                        if (data.progress !== undefined) {
                            setProgress(data.progress);
                        }

                        if (data.complete) {
                            setProcessing(false);
                            setProgress(100);

                            toast.success('Video processed successfully!', {
                                action: {
                                    label: 'Open',
                                    onClick: () => {
                                        window.open(`file://${data.outputPath}`, '_blank');
                                    },
                                },
                            });
                        }

                        if (data.error) {
                            throw new Error(data.error);
                        }
                    }
                }
            }
        } catch (error) {
            setProcessing(false);
            toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [videoPath, ranges]);

    const currentTimeFormatted = useMemo(() => formatTime(currentTime), [currentTime]);
    const durationFormatted = useMemo(() => formatTime(duration), [duration]);
    const progressPercent = useMemo(() => (currentTime / duration) * 100 || 0, [currentTime, duration]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-slate-400 hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Videos
                </Button>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border-slate-800 bg-slate-900/50 p-6">
                            <video
                                ref={videoRef}
                                src={`/api/videos/stream?path=${encodeURIComponent(videoPath)}`}
                                onLoadedMetadata={handleLoadedMetadata}
                                onTimeUpdate={handleTimeUpdate}
                                className="w-full rounded-lg bg-black"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            >
                                <track kind="captions" />
                            </video>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <Button
                                        size="icon"
                                        onClick={togglePlayPause}
                                        className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-5 w-5" />
                                        ) : (
                                            <Play className="ml-0.5 h-5 w-5" />
                                        )}
                                    </Button>

                                    <div className="flex-1">
                                        <div
                                            onClick={handleSeek}
                                            onKeyDown={handleSeek}
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

                                    <div className="flex-shrink-0 text-slate-400 text-sm tabular-nums">
                                        {currentTimeFormatted} / {durationFormatted}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {processing && (
                            <Card className="border-slate-800 bg-slate-900/50 p-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Processing video...</span>
                                        <span className="font-medium text-blue-400">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card className="border-slate-800 bg-slate-900/50 p-6">
                            <h2 className="mb-4 flex items-center gap-2 font-semibold text-white text-xl">
                                <Button
                                    onClick={handleScissorsClick}
                                    size="icon"
                                    variant="ghost"
                                    className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300"
                                >
                                    <Scissors className="h-5 w-5" />
                                </Button>
                                Time Ranges
                            </h2>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={rangeInput}
                                        onChange={(e) => setRangeInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addRange()}
                                        placeholder="0:11-2:15"
                                        className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                                    />
                                    <Button
                                        onClick={addRange}
                                        size="icon"
                                        className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="max-h-[400px] space-y-2 overflow-y-auto">
                                    {ranges.map((range) => {
                                        const rangeId = `${range.start}-${range.end}`;
                                        return (
                                            <Badge
                                                key={rangeId}
                                                variant="secondary"
                                                className="group w-full cursor-pointer justify-between bg-slate-800 px-4 py-2.5 font-normal text-base hover:bg-slate-700"
                                                onClick={() => seekToRange(range)}
                                            >
                                                <span className="text-white">
                                                    {range.start} - {range.end}
                                                </span>
                                                <X
                                                    className="h-4 w-4 text-slate-400 transition-colors hover:text-red-400"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRanges((prev) =>
                                                            prev.filter((r) => `${r.start}-${r.end}` !== rangeId),
                                                        );
                                                    }}
                                                />
                                            </Badge>
                                        );
                                    })}
                                </div>

                                <Button
                                    onClick={handleProcess}
                                    disabled={processing || ranges.length === 0}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    {processing ? 'Processing...' : 'Process Video'}
                                </Button>
                            </div>
                        </Card>

                        <Card className="border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="mb-2 font-medium text-slate-400 text-sm">Current Position</h3>
                            <p className="font-bold text-2xl text-blue-400 tabular-nums">{currentTimeFormatted}</p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
