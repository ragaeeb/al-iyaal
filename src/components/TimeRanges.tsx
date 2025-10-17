import { Plus, Scissors, X } from 'lucide-react';
import { memo, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CAPTURE_TIME_RANGE_PATTERN } from '@/lib/constants';
import { formatTime } from '@/lib/textUtils';
import type { TimeRange } from '@/types';
import { GrowingButton } from './cuicui/growing-button';
import SlicedText from './kokonutui/sliced-text';
import SubmittableInput from './submittable-input';

type TimeRangesProps = Readonly<{
    ranges: TimeRange[];
    onAddRange: (range: TimeRange) => void;
    onRemoveRange: (range: TimeRange) => void;
    onSeekToRange: (range: TimeRange) => void;
    currentTime: number;
    duration: number;
}>;

const RangeList = ({
    ranges,
    onSeekToRange,
    onRemoveRange,
}: Pick<TimeRangesProps, 'ranges' | 'onSeekToRange' | 'onRemoveRange'>) => {
    return (
        <div className="max-h-[300px] space-y-1.5 overflow-y-auto">
            {ranges.map((range) => {
                const rangeId = `${range.start}-${range.end}`;
                return (
                    <Badge
                        key={rangeId}
                        variant="secondary"
                        className="group w-full cursor-pointer justify-between bg-slate-800 px-3 py-2 font-normal text-sm hover:bg-slate-700"
                        onClick={() => onSeekToRange(range)}
                    >
                        <span className="text-white">
                            {range.start} - {range.end}
                        </span>
                        <button
                            type="button"
                            className="cursor-pointer p-0 text-slate-400 hover:text-red-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveRange(range);
                            }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </Badge>
                );
            })}
        </div>
    );
};

export const TimeRanges = memo<TimeRangesProps>(
    ({ ranges, onAddRange, onRemoveRange, onSeekToRange, currentTime, duration }) => {
        const inputRef = useRef<HTMLInputElement>(null);

        const addRange = useCallback(() => {
            if (!inputRef.current) {
                return;
            }

            const [, start, end] = inputRef.current.value.match(CAPTURE_TIME_RANGE_PATTERN) || [];

            if (end) {
                onAddRange({ end, start });

                if (inputRef.current) {
                    inputRef.current.value = '';
                }
            }
        }, [onAddRange]);

        return (
            <Card className="border-slate-800 bg-slate-900/50 p-4">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-lg text-white">
                    <GrowingButton
                        className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300"
                        hoverText={`Cut at ${formatTime(currentTime, duration)}`}
                        onClick={() => {
                            if (inputRef.current) {
                                let value = inputRef.current.value.trim();
                                const currentFormatted = formatTime(currentTime, duration);

                                if (value && !value.endsWith('-')) {
                                    value += '-';
                                }

                                value += currentFormatted;
                                inputRef.current.value = value;

                                if (value.match(CAPTURE_TIME_RANGE_PATTERN)) {
                                    addRange();
                                }
                            }
                        }}
                    >
                        <Scissors className="h-4 w-4 text-blue-400" />
                    </GrowingButton>
                    <SlicedText text="Time Ranges" />
                </h2>

                <div className="space-y-3">
                    <div className="flex gap-2">
                        <SubmittableInput
                            ref={inputRef}
                            name="range"
                            onSubmit={addRange}
                            placeholder="0:11-2:15"
                            className="h-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        />
                        <Button
                            onClick={addRange}
                            size="icon"
                            className="group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-blue-600 bg-blue-600 px-0 py-0 font-medium text-white text-xs transition-colors duration-300 ease-in hover:border-blue-700 hover:bg-blue-700 hover:shadow-blue-500/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus-visible:ring-2"
                        >
                            <Plus className="relative z-10 h-4 w-4" />
                            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-13deg)_translateX(100%)]">
                                <div className="relative h-full w-10 bg-white/20" />
                            </div>
                        </Button>
                    </div>
                    <RangeList ranges={ranges} onRemoveRange={onRemoveRange} onSeekToRange={onSeekToRange} />
                </div>
            </Card>
        );
    },
);

TimeRanges.displayName = 'TimeRanges';
