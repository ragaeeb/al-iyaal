import { Sparkles, SubtitlesIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTime } from '@/lib/textUtils';
import type { AnalysisStrategy, FlaggedSubtitle, SubtitleEntry } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './cuicui/mac-os-dropdown';

type SubtitlesPanelProps = {
    subtitles: SubtitleEntry[];
    flaggedSubtitles: FlaggedSubtitle[];
    analyzing: boolean;
    summary: string;
    subtitleFileName: string;
    duration: number;
    onDrop: (file: File) => void;
    onAnalyze: (strategy: AnalysisStrategy) => void;
    onClear: () => void;
    onSeekToTime: (time: number) => void;
};

const getPriorityStyles = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
        case 'high':
            return { badge: 'text-red-400/80', bg: 'bg-red-500/10', text: 'text-red-200' };
        case 'medium':
            return { badge: 'text-orange-400/80', bg: 'bg-orange-500/10', text: 'text-orange-200' };
        case 'low':
            return { badge: 'text-yellow-400/80', bg: 'bg-yellow-500/10', text: 'text-yellow-200' };
    }
};

const isWithinAcceptableRange = (f: FlaggedSubtitle, startTime: number, tolerance = 0.5) => {
    return Math.abs(f.startTime - startTime) < tolerance;
};

export const SubtitlesPanel = memo<SubtitlesPanelProps>(
    ({
        subtitles,
        flaggedSubtitles,
        analyzing,
        summary,
        duration,
        onDrop,
        onAnalyze,
        onClear,
        onSeekToTime,
        subtitleFileName,
    }) => {
        const [showOnlyConcerning, setShowOnlyConcerning] = useState(false);

        const displayedSubtitles = useMemo(() => {
            if (!showOnlyConcerning) {
                return subtitles;
            }
            return subtitles.filter((sub) => flaggedSubtitles.some((f) => isWithinAcceptableRange(f, sub.startTime)));
        }, [subtitles, flaggedSubtitles, showOnlyConcerning]);

        const concerningCount = flaggedSubtitles.length;

        const getFlaggedData = useCallback(
            (startTime: number) => flaggedSubtitles.find((f) => isWithinAcceptableRange(f, startTime)),
            [flaggedSubtitles],
        );

        if (subtitles.length === 0) {
            return (
                <Card className="border-slate-800 bg-slate-900/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-semibold text-lg text-white">
                            <SubtitlesIcon className="h-5 w-5 text-purple-400" />
                            Subtitles
                        </h2>
                    </div>
                    <button
                        type="button"
                        onDrop={(e) => {
                            e.preventDefault();
                            const [file] = e.dataTransfer.files;

                            if (file) {
                                onDrop(file);
                            }
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                        }}
                        className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-slate-700 border-dashed bg-slate-800/50 transition-colors hover:border-purple-500 hover:bg-slate-800"
                    >
                        <div className="text-center">
                            <SubtitlesIcon className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                            <p className="text-slate-400 text-sm">Drop .srt file here</p>
                        </div>
                    </button>
                </Card>
            );
        }

        const titleElement = (
            <h2 className="flex items-center gap-2 font-semibold text-lg text-white">
                <SubtitlesIcon className="h-5 w-5 text-purple-400" />
                {subtitleFileName ?? 'Subtitles'}
            </h2>
        );

        return (
            <Card className="border-slate-800 bg-slate-900/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                    {summary ? (
                        <Tooltip>
                            <TooltipTrigger asChild>{titleElement}</TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                                <p className="font-medium text-sm">Summary</p>
                                <p className="mt-1 text-xs">{summary}</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        titleElement
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild={true}>
                            <Button
                                size="sm"
                                disabled={analyzing}
                                className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ${analyzing ? 'animate-heartbeat' : ''}`}
                            >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                {analyzing ? 'Analyzing...' : 'Analyze'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => onAnalyze('fast')}>Quick</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onAnalyze('deep')}>Detailed</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <p className="text-slate-400 text-sm">
                                {subtitles.length} subtitle{subtitles.length !== 1 ? 's' : ''} loaded
                            </p>
                            {concerningCount > 0 && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowOnlyConcerning(!showOnlyConcerning)}
                                        className={`text-sm transition-colors ${
                                            showOnlyConcerning
                                                ? 'font-medium text-amber-400 hover:text-amber-300'
                                                : 'text-amber-400/70 hover:text-amber-400'
                                        }`}
                                    >
                                        {concerningCount} concerning
                                    </button>
                                </>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onClear}
                            className="h-7 text-slate-400 hover:text-red-400"
                        >
                            Clear
                        </Button>
                    </div>

                    <ScrollArea className="h-[400px] rounded-lg border border-slate-700 bg-slate-800/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                    <TableHead className="w-[100px] text-slate-400">Time</TableHead>
                                    <TableHead className="text-slate-400">Text</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedSubtitles.map((sub) => {
                                    const flaggedData = getFlaggedData(sub.startTime);
                                    const isFlagged = !!flaggedData;
                                    const styles = flaggedData
                                        ? getPriorityStyles(flaggedData.priority)
                                        : { badge: '', bg: '', text: 'text-slate-300' };

                                    return (
                                        <TableRow
                                            key={sub.index}
                                            role="button"
                                            tabIndex={0}
                                            className={`cursor-pointer border-slate-700 hover:bg-slate-700/50 ${isFlagged ? styles.bg : ''}`}
                                            onClick={() => onSeekToTime(sub.startTime)}
                                        >
                                            <TableCell className="font-mono text-purple-400 text-xs">
                                                {formatTime(sub.startTime, duration)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="space-y-1">
                                                    <p className={styles.text}>{sub.text}</p>
                                                    {isFlagged && flaggedData && (
                                                        <p
                                                            className={`whitespace-normal break-words ${styles.badge} text-xs`}
                                                        >
                                                            ⚠ {flaggedData.reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </Card>
        );
    },
);

SubtitlesPanel.displayName = 'SubtitlesPanel';
