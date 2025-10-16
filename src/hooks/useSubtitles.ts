import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { parseSrt } from '@/lib/srtParsing';
import type { FlaggedSubtitle, SubtitleEntry } from '@/types/subtitles';

export const useSubtitles = (videoPath: string) => {
    const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
    const [flaggedSubtitles, setFlaggedSubtitles] = useState<FlaggedSubtitle[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    const loadSubtitlesFromPath = useCallback(async (srtPath: string) => {
        try {
            const response = await fetch(`/api/videos/stream?path=${encodeURIComponent(srtPath)}`);
            if (response.ok) {
                const content = await response.text();
                const parsedSubtitles = parseSrt(content);
                setSubtitles(parsedSubtitles);
                setFlaggedSubtitles([]);
                toast.success('Subtitles loaded automatically');
            }
        } catch (error) {
            console.error('Failed to load subtitles:', error);
        }
    }, []);

    const handleSubtitleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.srt')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target?.result as string;
                    const parsedSubtitles = parseSrt(content);
                    setSubtitles(parsedSubtitles);
                    setFlaggedSubtitles([]);
                    toast.success('Subtitles loaded successfully');
                };
                reader.readAsText(file);
            } else {
                toast.error('Please drop a .srt file');
            }
        }
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (subtitles.length === 0) {
            toast.error('No subtitles to analyze');
            return;
        }

        setAnalyzing(true);

        try {
            const response = await fetch('/api/subtitles/analyze', {
                body: JSON.stringify({ subtitles }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to start analysis');
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

                        if (data.status === 'analyzing') {
                            toast.info('Analyzing subtitles...');
                        } else if (data.status === 'retrying') {
                            toast.info('Retrying analysis...');
                        } else if (data.complete) {
                            setFlaggedSubtitles(data.flagged);
                            setAnalyzing(false);
                            const count = data.flagged.length;
                            if (count === 0) {
                                toast.success('No concerning content found');
                            } else {
                                toast.warning(`Found ${count} concerning ${count === 1 ? 'item' : 'items'}`);
                            }
                        } else if (data.error) {
                            throw new Error(data.error);
                        }
                    }
                }
            }
        } catch (error) {
            setAnalyzing(false);
            toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [subtitles]);

    const clearSubtitles = useCallback(() => {
        setSubtitles([]);
        setFlaggedSubtitles([]);
    }, []);

    useEffect(() => {
        if (videoPath) {
            const srtPath = videoPath.replace(/\.[^.]+$/, '.srt');
            loadSubtitlesFromPath(srtPath);
        }
    }, [videoPath, loadSubtitlesFromPath]);

    return { analyzing, clearSubtitles, flaggedSubtitles, handleAnalyze, handleSubtitleDrop, subtitles };
};
