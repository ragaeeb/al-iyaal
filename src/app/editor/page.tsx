'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { SubtitlesPanel } from '@/components/SubtitlesPanel';
import { TimeRanges } from '@/components/TimeRanges';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoControls } from '@/components/VideoControls';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useSubtitles } from '@/hooks/useSubtitles';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useVideoRemount } from '@/hooks/useVideoRemount';
import { parseTimeToSeconds } from '@/lib/srtParsing';
import type { TimeRange } from '@/types/subtitles';

const EditorPage = () => {
    const searchParams = useSearchParams();
    const [ranges, setRanges] = useState<TimeRange[]>([]);
    const videoPath = searchParams.get('path') || '';
    const srtPath = searchParams.get('srt') || undefined;
    const router = useRouter();

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

    const { subtitles, flaggedSubtitles, analyzing, handleSubtitleDrop, handleAnalyze, clearSubtitles } =
        useSubtitles(srtPath);

    const { processing, progress, handleProcess } = useVideoProcessing(videoPath, ranges);

    const showVideo = useVideoRemount(videoPath);

    const currentSubtitle = useMemo(() => {
        return subtitles.find((sub) => currentTime >= sub.startTime && currentTime <= sub.endTime);
    }, [subtitles, currentTime]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const handleSeekToRange = useCallback(
        (range: { start: string; end: string }) => {
            const time = parseTimeToSeconds(range.start);
            seekTo(time);
        },
        [seekTo],
    );

    const addRange = useCallback((range: TimeRange) => {
        setRanges((prev) => prev.concat(range));
    }, []);

    const removeRange = useCallback((range: TimeRange) => {
        setRanges((prev) => prev.filter((r) => r !== range));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto max-w-[1800px] px-6 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Videos
                    </Button>

                    <Button
                        onClick={handleProcess}
                        disabled={processing || ranges.length === 0}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        {processing ? 'Processing...' : 'Process Video'}
                    </Button>
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
                            onRemoveRange={removeRange}
                            onSeekToRange={handleSeekToRange}
                        />

                        <SubtitlesPanel
                            subtitles={subtitles}
                            flaggedSubtitles={flaggedSubtitles}
                            analyzing={analyzing}
                            onDrop={handleSubtitleDrop}
                            onDragOver={handleDragOver}
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

export default EditorPage;
