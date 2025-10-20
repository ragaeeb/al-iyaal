'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import GlowText from '@/components/cuicui/glow-text';
import { MainMenusGradientCard } from '@/components/cuicui/gradient-card';
import AttractButton from '@/components/kokonutui/attract-button';
import { Input } from '@/components/ui/input';
import { VIDEO_EXTENSIONS_PATTERN } from '@/lib/constants';

const HomePage = () => {
    const router = useRouter();
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.value = localStorage.getItem('videoFolderPath') || '';
        }
    }, []);

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
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const path = (formData.get('videoFolderPath')! as string).trim();

                            if (!path) {
                                return;
                            }

                            localStorage.setItem('videoFolderPath', path);

                            const isFile = VIDEO_EXTENSIONS_PATTERN.test(path);
                            const encoded = encodeURIComponent(path);
                            router.push(isFile ? `/editor?path=${encoded}` : `/videos?path=${encoded}`);
                        }}
                        className="flex gap-3"
                    >
                        <Input
                            type="text"
                            ref={ref}
                            name="videoFolderPath"
                            autoComplete="on"
                            placeholder="/path/to/folder or /path/to/video.mp4"
                            className="h-12 flex-1 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-blue-400 focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.30)] focus:outline-none dark:focus:border-blue-700 dark:focus:shadow-[0_0_0_0.2rem_rgba(0,111,200,0.35)]"
                        />
                        <AttractButton
                            type="submit"
                            className="h-12 bg-blue-600 px-8 hover:bg-blue-700"
                            text="List Videos"
                            hoverText="Browse Videos"
                        />
                    </form>
                </MainMenusGradientCard>
            </div>
        </div>
    );
};

export default HomePage;
