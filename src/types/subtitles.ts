export type TimeRange = { start: string; end: string };

export type SubtitleEntry = { index: number; startTime: number; endTime: number; text: string };

export type FlaggedSubtitle = { startTime: number; endTime: number; text: string; reason: string };
