'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AttractButton from '@/components/kokonutui/attract-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const HomePage = () => {
    const router = useRouter();
    const [inputPath, setInputPath] = useState('');

    const handleList = () => {
        if (!inputPath.trim()) {
            return;
        }

        const isFile = inputPath.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i);

        if (isFile) {
            router.push(`/editor?path=${encodeURIComponent(inputPath)}`);
        } else {
            router.push(`/videos?path=${encodeURIComponent(inputPath)}`);
        }
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

                <Card className="border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="/path/to/folder or /path/to/video.mp4"
                            value={inputPath}
                            onChange={(e) => setInputPath(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleList()}
                            className="h-12 flex-1 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        />
                        <AttractButton
                            onClick={handleList}
                            disabled={!inputPath.trim()}
                            className="h-12 bg-blue-600 px-8 hover:bg-blue-700"
                            text="List Videos"
                            hoverText="Browse Videos"
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default HomePage;
