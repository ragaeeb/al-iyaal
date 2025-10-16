'use client';

import { Clock, HardDrive, Upload, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type VideoFile = { name: string; path: string; duration: string; size: string };

const HomePage = () => {
    const router = useRouter();
    const [inputPath, setInputPath] = useState('');
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [loading, setLoading] = useState(false);

    const handleList = async () => {
        if (!inputPath.trim()) {
            return;
        }

        const isFile = inputPath.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i);

        if (isFile) {
            router.push(`/editor?path=${encodeURIComponent(inputPath)}`);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/videos/list', {
                body: JSON.stringify({ folderPath: inputPath }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });
            const data = await response.json();
            setVideos(data.videos || []);
        } catch (error) {
            console.error('Failed to load videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVideoSelect = (video: VideoFile) => {
        router.push(`/editor?path=${encodeURIComponent(video.path)}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto max-w-5xl px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text font-bold text-5xl text-transparent">
                        Video Editor
                    </h1>
                    <p className="text-lg text-slate-400">Select a video file to begin editing</p>
                </div>

                <Card className="mb-8 border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="/path/to/folder or /path/to/video.mp4"
                            value={inputPath}
                            onChange={(e) => setInputPath(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleList()}
                            className="h-12 flex-1 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        />
                        <Button
                            onClick={handleList}
                            disabled={loading || !inputPath.trim()}
                            className="h-12 bg-blue-600 px-8 hover:bg-blue-700"
                        >
                            {loading ? 'Loading...' : 'List'}
                        </Button>
                    </div>
                </Card>

                {videos.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-2xl">
                            <Video className="h-6 w-6 text-blue-400" />
                            Videos Found ({videos.length})
                        </h2>
                        {videos.map((video, index) => (
                            <Card
                                key={index}
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
                                    <div className="flex flex-shrink-0 gap-6 text-slate-400 text-sm">
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
                )}
            </div>
        </div>
    );
};

export default HomePage;
