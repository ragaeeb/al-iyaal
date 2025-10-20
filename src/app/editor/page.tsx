'use client';

import { HardDrive, Settings, Video } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo } from 'react';
import CallToAction from '@/components/cuicui/call-to-action';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/cuicui/mac-os-dropdown';
import { ModernAnimatedButton } from '@/components/cuicui/modern-animated-button';
import { CascadeLoader } from '@/components/loaders/CascadeLoader';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { SubtitlesPanel } from '@/components/SubtitlesPanel';
import { TimeRanges } from '@/components/TimeRanges';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoControls } from '@/components/VideoControls';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useSubtitles } from '@/hooks/useSubtitles';
import { useTimeRanges } from '@/hooks/useTimeRanges';
import { useVideoMetadata } from '@/hooks/useVideoMetadata';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useVideoRemount } from '@/hooks/useVideoRemount';
import { parseTimeToSeconds } from '@/lib/textUtils';
import type { VideoQuality } from '@/types';

const EditorContent = () => {
    const searchParams = useSearchParams();
    const videoPath = searchParams.get('path') || '';
    const srtPath = searchParams.get('srt') || undefined;
    const router = useRouter();

    const { ranges, addRange, removeRange } = useTimeRanges(videoPath);
    const { metadata } = useVideoMetadata(videoPath);

    const {
        videoRef,
        isPlaying,
        setIsPlaying,
        currentTime,
        duration,
        handleLoadedMetadata,
        handleTimeUpdate,
        togglePlayPause,
        skipTime,
        seekTo,
    } = useVideoPlayer();

    const {
        subtitles,
        flaggedSubtitles,
        analyzing,
        summary,
        subtitleFileName,
        handleSubtitleDrop,
        handleAnalyze,
        clearSubtitles,
    } = useSubtitles(srtPath);

    const { processing, progress, handleProcess } = useVideoProcessing(videoPath, ranges);

    const showVideo = useVideoRemount(videoPath);

    const currentSubtitle = useMemo(() => {
        return subtitles.find((sub) => currentTime >= sub.startTime && currentTime <= sub.endTime);
    }, [subtitles, currentTime]);

    const handleSeekToRange = useCallback(
        (range: { start: string; end: string }) => {
            const time = parseTimeToSeconds(range.start);
            seekTo(time);
        },
        [seekTo],
    );

    // Estimate output size based on duration and quality
    const estimateOutputSize = useCallback(
        (quality: VideoQuality) => {
            if (!duration) {
                return '';
            }

            const durationMin = duration / 60;
            let bitrateKbps: number;

            switch (quality) {
                case 'high':
                    bitrateKbps = 5000; // ~150MB for 4min, ~2.25GB for 1hr
                    break;
                case 'medium':
                    bitrateKbps = 2500; // ~75MB for 4min, ~1.13GB for 1hr
                    break;
                case 'low':
                    bitrateKbps = 1000; // ~30MB for 4min, ~450MB for 1hr
                    break;
                case 'ultralow':
                    bitrateKbps = 500; // ~15MB for 4min, ~225MB for 1hr
                    break;
            }

            const sizeMB = (bitrateKbps * durationMin * 60) / (8 * 1024);

            if (sizeMB < 1024) {
                return `~${Math.round(sizeMB)}MB`;
            } else {
                return `~${(sizeMB / 1024).toFixed(2)}GB`;
            }
        },
        [duration],
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto max-w-[1800px] px-6 py-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <CallToAction onClick={router.back} pillText="Videos">
                            Back to
                        </CallToAction>

                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            {metadata && (
                                <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                    <HardDrive className="h-4 w-4 flex-shrink-0" />
                                    <span>{metadata.size}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-3">
                        <Button
                            onClick={() => router.push('/settings')}
                            variant="outline"
                            size="sm"
                            className="border-slate-700 bg-slate-800 hover:bg-slate-700"
                        >
                            <Settings />
                        </Button>
                        {!processing && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild={true}>
                                    <Button
                                        disabled={ranges.length === 0}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                        <Video className="mr-2 h-4 w-4" />
                                        Process Video
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => handleProcess('high')}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">High Quality</span>
                                            <span className="text-slate-400 text-xs">
                                                5 Mbps • Best for short videos {estimateOutputSize('high')}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleProcess('medium')}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">Medium Quality</span>
                                            <span className="text-slate-400 text-xs">
                                                2.5 Mbps • Balanced {estimateOutputSize('medium')}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleProcess('low')}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">Low Quality</span>
                                            <span className="text-slate-400 text-xs">
                                                1 Mbps • Good for long videos {estimateOutputSize('low')}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleProcess('ultralow')}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">Ultra Low</span>
                                            <span className="text-slate-400 text-xs">
                                                500 Kbps • Smallest size {estimateOutputSize('ultralow')}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        {processing && (
                            <ModernAnimatedButton>
                                <span>Processing</span>
                                <span className="h-5/6 w-px bg-neutral-700/50" />
                                <span className="text-neutral-500">Video</span>
                            </ModernAnimatedButton>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <Card className="border-slate-800 bg-slate-900/50 p-4">
                            <VideoPlayer
                                videoPath={videoPath}
                                videoRef={videoRef}
                                currentSubtitle={currentSubtitle}
                                onLoadedMetadata={handleLoadedMetadata}
                                onTimeUpdate={handleTimeUpdate}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                showVideo={showVideo}
                            />

                            <VideoControls
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                                duration={duration}
                                onTogglePlayPause={togglePlayPause}
                                onSkipTime={skipTime}
                                onSeek={seekTo}
                            />
                        </Card>

                        {processing && <ProcessingProgress progress={progress} />}
                    </div>

                    <div className="space-y-4">
                        <TimeRanges
                            ranges={ranges}
                            onAddRange={addRange}
                            currentTime={currentTime}
                            duration={duration}
                            onRemoveRange={removeRange}
                            onSeekToRange={handleSeekToRange}
                        />

                        <SubtitlesPanel
                            subtitles={subtitles}
                            flaggedSubtitles={flaggedSubtitles}
                            analyzing={analyzing}
                            summary={summary}
                            subtitleFileName={subtitleFileName}
                            duration={duration}
                            onDrop={handleSubtitleDrop}
                            onAnalyze={handleAnalyze}
                            onClear={clearSubtitles}
                            onSeekToTime={seekTo}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditorPage = () => {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                    <CascadeLoader />
                </div>
            }
        >
            <EditorContent />
        </Suspense>
    );
};

export default EditorPage;
