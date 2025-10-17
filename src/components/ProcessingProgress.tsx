import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type ProcessingProgressProps = { progress: number };

export const ProcessingProgress = memo<ProcessingProgressProps>(({ progress }) => {
    return (
        <Card className="border-slate-800 bg-slate-900/50 p-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Processing video...</span>
                    <span className="font-medium text-blue-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
        </Card>
    );
});

ProcessingProgress.displayName = 'ProcessingProgress';
