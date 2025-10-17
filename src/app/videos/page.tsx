'use client';

import { Clock, FileText, HardDrive, Video } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import ScrambleHover from '@/components/cuicui/scramble';
import { CascadeLoader } from '@/components/loaders/CascadeLoader';
import { Card } from '@/components/ui/card';
import type { VideoFile } from '@/types';

const VideosContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const folderPath = searchParams.get('path') || '';

    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVideos = async () => {
            if (!folderPath) {
                router.push('/');
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`/api/videos/list?path=${encodeURIComponent(folderPath)}`);
                const data = await response.json();
                setVideos(data.videos || []);
            } catch (error) {
                console.error('Failed to load videos:', error);
            } finally {
                setLoading(false);
            }
        };

        loadVideos();
    }, [folderPath, router]);

    const handleVideoSelect = (video: VideoFile) => {
        let editorUrl = `/editor?path=${encodeURIComponent(video.path)}`;
        if (video.subtitlePath) {
            editorUrl += `&srt=${encodeURIComponent(video.subtitlePath)}`;
        }
        router.push(editorUrl);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                <CascadeLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto max-w-5xl px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text font-bold text-5xl text-transparent">
                        Videos
                    </h1>
                    <ScrambleHover
                        text={folderPath}
                        scrambleSpeed={40}
                        sequential={true}
                        revealDirection="start"
                        useOriginalCharsOnly={false}
                        className="font-azeretMono text-lg text-slate-400"
                        characters="abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;':\,./<>?"
                    />
                </div>

                {videos.length > 0 ? (
                    <div className="space-y-3">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-2xl">
                            <Video className="h-6 w-6 text-blue-400" />
                            Videos Found ({videos.length})
                        </h2>
                        {videos.map((video) => (
                            <Card
                                key={video.path}
                                onClick={() => handleVideoSelect(video)}
                                className="cursor-pointer border-slate-800 bg-slate-900/50 p-5 transition-all duration-200 hover:border-blue-500/50 hover:bg-slate-800/50"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex min-w-0 flex-1 items-center gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600/20">
                                            <Video className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-white">{video.name}</p>
                                            <p className="truncate text-slate-500 text-sm">{video.path}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-6 text-slate-400 text-sm">
                                        {video.subtitlePath && (
                                            <div className="flex items-center gap-2" title="Subtitles found">
                                                <FileText className="h-4 w-4 text-green-400" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {video.duration}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4" />
                                            {video.size}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-slate-400">No videos found in this folder</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const VideosPage = () => {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                    <CascadeLoader />
                </div>
            }
        >
            <VideosContent />
        </Suspense>
    );
};

export default VideosPage;
