'use client';

import { HardDrive, Settings } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo } from 'react';
import CallToAction from '@/components/cuicui/call-to-action';
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
                            <Button
                                onClick={handleProcess}
                                disabled={ranges.length === 0}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                Process Video
                            </Button>
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
