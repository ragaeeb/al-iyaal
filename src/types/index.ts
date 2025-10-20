export type TimeRange = { start: string; end: string };

export type SubtitleEntry = { index: number; startTime: number; endTime: number; text: string };

export type FlaggedSubtitle = {
    startTime: number;
    endTime: number;
    text: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
};

export type AnalysisStrategy = 'fast' | 'deep';

export type AnalysisResult = {
    flagged: Array<{ startTime: number; reason: string; priority: 'high' | 'medium' | 'low' }>;
    summary: string;
};

export type PromptSettings = { contentCriteria: string; priorityGuidelines: string };

export type VideoFile = { name: string; path: string; duration: string; size: string; subtitlePath?: string };

export type VideoQuality = 'passthrough' | 'high' | 'medium' | 'low' | 'ultralow';
