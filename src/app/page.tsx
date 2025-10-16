'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GlowText from '@/components/cuicui/glow-text';
import { MainMenusGradientCard } from '@/components/cuicui/gradient-card';
import AttractButton from '@/components/kokonutui/attract-button';
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
                    <GlowText className="mb-4 py-2 font-bold text-5xl">al-ʿIyāl Video Editor</GlowText>
                </div>

                <MainMenusGradientCard
                    title="Select a video file or folder to begin editing"
                    className="border-slate-800 bg-slate-900/50 p-8 backdrop-blur"
                >
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
                </MainMenusGradientCard>
            </div>
        </div>
    );
};

export default HomePage;
