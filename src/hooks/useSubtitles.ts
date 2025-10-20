import path from 'path';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { parseSrt } from '@/lib/textUtils';
import type { AnalysisStrategy, FlaggedSubtitle, SubtitleEntry } from '@/types';

export const useSubtitles = (srtPath?: string) => {
    const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
    const [flaggedSubtitles, setFlaggedSubtitles] = useState<FlaggedSubtitle[]>([]);
    const [summary, setSummary] = useState<string>('');
    const [analyzing, setAnalyzing] = useState(false);
    const [subtitleFileName, setSubtitleFileName] = useState<string>('');

    const loadSubtitlesFromPath = useCallback(async (filePath: string) => {
        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`);
            if (response.ok) {
                const content = await response.text();
                const parsedSubtitles = parseSrt(content);
                setSubtitles(parsedSubtitles);
                setFlaggedSubtitles([]);
                setSummary('');
                setSubtitleFileName(path.basename(filePath));
                toast.success('Subtitles loaded automatically');
            } else {
                const msg = `Failed to load subtitles (HTTP ${response.status})`;
                console.error(msg);
                toast.error(msg);
            }
        } catch (error) {
            console.error('Failed to load subtitles:', error);
            toast.error('Failed to load subtitles');
        }
    }, []);

    const handleSubtitleDrop = useCallback((file: File) => {
        if (file.name.toLowerCase().endsWith('.srt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                const parsedSubtitles = parseSrt(content);
                setSubtitles(parsedSubtitles);
                setFlaggedSubtitles([]);
                setSummary('');
                setSubtitleFileName(file.name);
                toast.success('Subtitles loaded successfully');
            };
            reader.onerror = () => {
                toast.error('Failed to read subtitle file');
            };
            reader.readAsText(file);
        } else {
            toast.error('Please drop a .srt file');
        }
    }, []);

    const handleAnalyze = useCallback(
        async (strategy: AnalysisStrategy) => {
            if (subtitles.length === 0) {
                toast.error('No subtitles to analyze');
                return;
            }

            setAnalyzing(true);

            try {
                const response = await fetch('/api/subtitles/analyze', {
                    body: JSON.stringify({ strategy, subtitles }),
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
                                setSummary(data.summary || '');
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
        },
        [subtitles],
    );

    const clearSubtitles = useCallback(() => {
        setSubtitles([]);
        setFlaggedSubtitles([]);
        setSummary('');
        setSubtitleFileName('');
    }, []);

    useEffect(() => {
        if (srtPath) {
            loadSubtitlesFromPath(srtPath);
        }
    }, [srtPath, loadSubtitlesFromPath]);

    return {
        analyzing,
        clearSubtitles,
        flaggedSubtitles,
        handleAnalyze,
        handleSubtitleDrop,
        subtitleFileName,
        subtitles,
        summary,
    };
};
