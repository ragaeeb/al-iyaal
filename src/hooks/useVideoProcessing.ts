import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { TimeRange } from '@/types';

export const useVideoProcessing = (videoPath: string, ranges: TimeRange[]) => {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleProcess = useCallback(async () => {
        if (ranges.length === 0) {
            toast.error('Please add at least one time range');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const response = await fetch('/api/videos/process', {
                body: JSON.stringify({ path: videoPath, ranges }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to start processing');
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

                        if (data.progress !== undefined) {
                            setProgress(data.progress);
                        }

                        if (data.complete) {
                            setProcessing(false);
                            setProgress(100);

                            toast.success('Video processed successfully!', {
                                action: {
                                    label: 'Open',
                                    onClick: () => {
                                        window.open(`file://${data.outputPath}`, '_blank');
                                    },
                                },
                            });
                        }

                        if (data.error) {
                            throw new Error(data.error);
                        }
                    }
                }
            }
        } catch (error) {
            setProcessing(false);
            toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [videoPath, ranges]);

    return { handleProcess, processing, progress };
};
