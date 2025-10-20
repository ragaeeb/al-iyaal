'use client';

import { ArrowUpDown, Clock, FileText, HardDrive, Video } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import ScrambleHover from '@/components/cuicui/scramble';
import { CascadeLoader } from '@/components/loaders/CascadeLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { VideoFile } from '@/types';

type SortField = 'name' | 'duration' | 'size';
type SortDirection = 'asc' | 'desc';

// Header Component
const PageHeader = ({ folderPath }: { folderPath: string }) => (
    <div className="mb-12 text-center">
        <h1 className="mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text font-bold text-5xl text-transparent">
            Videos
        </h1>
        <ScrambleHover
            text={folderPath}
            scrambleSpeed={40}
            sequential={true}
            revealDirection="start"
            useOriginalCharsOnly={false}
            className="font-azeretMono text-lg text-slate-400"
            characters="abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;':,./<>?"
        />
    </div>
);

// Filter Bar Component
const FilterBar = ({
    count,
    filter,
    onFilterChange,
}: {
    count: number;
    filter: string;
    onFilterChange: (value: string) => void;
}) => (
    <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-300">
            <Video className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-lg">{count} Videos</span>
        </div>
        <Input
            type="text"
            placeholder="Filter by name..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="flex-1 border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500"
        />
    </div>
);

// Table Component
const VideosTable = ({
    videos,
    sortField,
    sortDirection,
    onSort,
    onVideoSelect,
}: {
    videos: VideoFile[];
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onVideoSelect: (video: VideoFile) => void;
}) => {
    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            onClick={() => onSort(field)}
            className={`flex items-center gap-2 p-0 hover:bg-transparent hover:text-white ${
                sortField === field ? 'text-blue-400' : ''
            }`}
        >
            {children}
            <ArrowUpDown className={`h-4 w-4 ${sortField === field && sortDirection === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
    );

    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">
                            <SortButton field="name">Name</SortButton>
                        </TableHead>
                        <TableHead className="text-slate-300">Subtitles</TableHead>
                        <TableHead className="text-slate-300">
                            <SortButton field="duration">Duration</SortButton>
                        </TableHead>
                        <TableHead className="text-slate-300">
                            <SortButton field="size">Size</SortButton>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {videos.map((video) => (
                        <TableRow
                            key={video.path}
                            onClick={() => onVideoSelect(video)}
                            className="cursor-pointer border-slate-800 transition-colors hover:bg-slate-800/50"
                        >
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600/20">
                                        <Video className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-white">{video.name}</p>
                                        <p className="truncate text-slate-500 text-xs">{video.path}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {video.subtitlePath && <FileText className="h-4 w-4 text-green-400" />}
                            </TableCell>
                            <TableCell className="text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {video.duration}
                                </div>
                            </TableCell>
                            <TableCell className="text-slate-300">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-4 w-4 text-slate-400" />
                                    {video.size}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

// Main Content Component
const VideosContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const folderPath = searchParams.get('path') || '';

    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    useEffect(() => {
        const controller = new AbortController();

        const loadVideos = async () => {
            if (!folderPath) {
                router.replace('/');
                return;
            }

            setLoading(true);

            try {
                const response = await fetch(`/api/videos/list?path=${encodeURIComponent(folderPath)}`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setVideos(data.videos || []);
                }
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Failed to load videos:', error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadVideos();

        return () => controller.abort();
    }, [folderPath, router]);

    const filteredAndSortedVideos = useMemo(() => {
        const result = videos.filter((video) => video.name.toLowerCase().includes(filter.toLowerCase()));

        result.sort((a, b) => {
            let comparison = 0;

            if (sortField === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortField === 'duration') {
                const parseTime = (time: string) => {
                    const parts = time.split(':').map(Number);
                    return parts.reduce((acc, val) => acc * 60 + val, 0);
                };
                comparison = parseTime(a.duration) - parseTime(b.duration);
            } else if (sortField === 'size') {
                const parseSize = (size: string) => {
                    const match = size.match(/([\d.]+)\s*(GB|MB|KB)/i);
                    if (!match) {
                        return 0;
                    }
                    const value = parseFloat(match[1]);
                    const unit = match[2].toUpperCase();
                    const multipliers = { GB: 1024 ** 3, KB: 1024, MB: 1024 ** 2 };
                    return value * (multipliers[unit as keyof typeof multipliers] || 1);
                };
                comparison = parseSize(a.size) - parseSize(b.size);
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [videos, filter, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleVideoSelect = (video: VideoFile) => {
        let editorUrl = `/editor?path=${encodeURIComponent(video.path)}`;
        if (video.subtitlePath) {
            editorUrl += `&srt=${encodeURIComponent(video.subtitlePath)}`;
        }
        router.push(editorUrl);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                <CascadeLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto px-6 py-12">
                <PageHeader folderPath={folderPath} />

                {videos.length > 0 ? (
                    <div className="space-y-6">
                        <FilterBar count={filteredAndSortedVideos.length} filter={filter} onFilterChange={setFilter} />
                        <VideosTable
                            videos={filteredAndSortedVideos}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            onVideoSelect={handleVideoSelect}
                        />
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-slate-400">No videos found in this folder</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const VideosPage = () => {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                    <CascadeLoader />
                </div>
            }
        >
            <VideosContent />
        </Suspense>
    );
};

export default VideosPage;
