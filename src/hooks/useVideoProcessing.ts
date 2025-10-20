import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { parseTimeToSeconds } from '@/lib/textUtils';
import type { TimeRange, VideoQuality } from '@/types';

export const useVideoProcessing = (videoPath: string, ranges: TimeRange[]) => {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleProcess = useCallback(
        async (quality: VideoQuality) => {
            if (ranges.length === 0) {
                toast.error('Please add at least one time range');
                return;
            }

            console.log('ranges', ranges);

            const invalid = ranges.some((r) => {
                const [start, end] = [r.start, r.end].map(parseTimeToSeconds);
                return !Number.isFinite(start) || !Number.isFinite(end) || Number(start) < 0 || end <= start;
            });

            console.log('invalid', invalid);

            if (invalid) {
                toast.error('Please ensure each time range has start < end and non-negative values');
                return;
            }

            setProcessing(true);
            setProgress(0);

            try {
                const response = await fetch('/api/videos/process', {
                    body: JSON.stringify({ path: videoPath, quality, ranges }),
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

                                toast.success(`Video processed successfully! Please go to ${data.outputPath}`);
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
        },
        [videoPath, ranges],
    );

    return { handleProcess, processing, progress };
};
