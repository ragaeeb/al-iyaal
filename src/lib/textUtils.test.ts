import { describe, expect, it } from 'bun:test';
import { formatDuration, formatSize, formatTime, parseSrt, parseSrtTime, parseTimeToSeconds } from './textUtils';

describe('formatDuration', () => {
    it('should format seconds only when less than a minute', () => {
        expect(formatDuration(45)).toBe('0:45');
    });

    it('should format minutes and seconds when less than an hour', () => {
        expect(formatDuration(125)).toBe('2:05');
    });

    it('should format hours, minutes, and seconds when an hour or more', () => {
        expect(formatDuration(3665)).toBe('1:01:05');
    });

    it('should pad minutes and seconds with leading zeros', () => {
        expect(formatDuration(3605)).toBe('1:00:05');
    });

    it('should handle zero seconds', () => {
        expect(formatDuration(0)).toBe('0:00');
    });

    it('should handle exactly one hour', () => {
        expect(formatDuration(3600)).toBe('1:00:00');
    });

    it('should handle multiple hours', () => {
        expect(formatDuration(7325)).toBe('2:02:05');
    });
});

describe('formatSize', () => {
    it('should format bytes when less than 1024', () => {
        expect(formatSize(500)).toBe('500.0 B');
    });

    it('should format kilobytes', () => {
        expect(formatSize(1024)).toBe('1.0 KB');
        expect(formatSize(2048)).toBe('2.0 KB');
    });

    it('should format megabytes', () => {
        expect(formatSize(1048576)).toBe('1.0 MB');
        expect(formatSize(5242880)).toBe('5.0 MB');
    });

    it('should format gigabytes', () => {
        expect(formatSize(1073741824)).toBe('1.0 GB');
    });

    it('should round to one decimal place', () => {
        expect(formatSize(1536)).toBe('1.5 KB');
        expect(formatSize(1587)).toMatch(/1\.[56] KB/);
    });

    it('should handle zero bytes', () => {
        expect(formatSize(0)).toBe('0.0 B');
    });
});

describe('formatTime', () => {
    it('should format time without hours when less than an hour', () => {
        expect(formatTime(125)).toBe('2:05');
    });

    it('should format time with hours when duration is an hour or more', () => {
        expect(formatTime(3665)).toBe('1:01:05');
    });

    it('should show hours based on maxDuration parameter', () => {
        expect(formatTime(125, 3600)).toBe('0:02:05');
    });

    it('should not show hours when maxDuration is less than an hour', () => {
        expect(formatTime(125, 500)).toBe('2:05');
    });

    it('should pad minutes and seconds with leading zeros', () => {
        expect(formatTime(5)).toBe('0:05');
        expect(formatTime(65)).toBe('1:05');
    });

    it('should handle zero seconds', () => {
        expect(formatTime(0)).toBe('0:00');
    });

    it('should handle exactly one hour', () => {
        expect(formatTime(3600)).toBe('1:00:00');
    });

    it('should format time correctly when current time is small but maxDuration is large', () => {
        expect(formatTime(30, 7200)).toBe('0:00:30');
    });
});

describe('parseTimeToSeconds', () => {
    it('should parse seconds only', () => {
        expect(parseTimeToSeconds('45')).toBe(45);
    });

    it('should parse minutes and seconds', () => {
        expect(parseTimeToSeconds('2:05')).toBe(125);
    });

    it('should parse hours, minutes, and seconds', () => {
        expect(parseTimeToSeconds('1:01:05')).toBe(3665);
    });

    it('should handle leading zeros', () => {
        expect(parseTimeToSeconds('00:05')).toBe(5);
        expect(parseTimeToSeconds('01:00:05')).toBe(3605);
    });

    it('should handle zero time', () => {
        expect(parseTimeToSeconds('0:00')).toBe(0);
    });

    it('should parse multiple hours correctly', () => {
        expect(parseTimeToSeconds('2:30:45')).toBe(9045);
    });
});

describe('parseSrtTime', () => {
    it('should parse SRT time format with milliseconds', () => {
        expect(parseSrtTime('00:00:01,500')).toBe(1.5);
    });

    it('should parse hours, minutes, seconds, and milliseconds', () => {
        expect(parseSrtTime('01:02:03,456')).toBe(3723.456);
    });

    it('should handle zero time', () => {
        expect(parseSrtTime('00:00:00,000')).toBe(0);
    });

    it('should handle times with only milliseconds', () => {
        expect(parseSrtTime('00:00:00,999')).toBe(0.999);
    });

    it('should parse time at exactly one hour', () => {
        expect(parseSrtTime('01:00:00,000')).toBe(3600);
    });

    it('should handle large hour values', () => {
        expect(parseSrtTime('12:34:56,789')).toBe(45296.789);
    });
});

describe('parseSrt', () => {
    it('should parse a basic SRT subtitle block', () => {
        const srt = `1
00:00:01,000 --> 00:00:03,000
Hello world`;

        const result = parseSrt(srt);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ endTime: 3, index: 1, startTime: 1, text: 'Hello world' });
    });

    it('should parse multiple subtitle blocks', () => {
        const srt = `1
00:00:01,000 --> 00:00:03,000
First subtitle

2
00:00:04,000 --> 00:00:06,000
Second subtitle`;

        const result = parseSrt(srt);
        expect(result).toHaveLength(2);
        expect(result[0].text).toBe('First subtitle');
        expect(result[1].text).toBe('Second subtitle');
    });

    it('should handle multi-line subtitle text', () => {
        const srt = `1
00:00:01,000 --> 00:00:03,000
Line one
Line two
Line three`;

        const result = parseSrt(srt);
        expect(result).toHaveLength(1);
        expect(result[0].text).toBe('Line one\nLine two\nLine three');
    });

    it('should parse subtitle with correct timing', () => {
        const srt = `1
00:01:30,500 --> 00:01:35,750
Timed subtitle`;

        const result = parseSrt(srt);
        expect(result[0].startTime).toBe(90.5);
        expect(result[0].endTime).toBe(95.75);
    });

    it('should handle empty input', () => {
        const result = parseSrt('');
        expect(result).toHaveLength(0);
    });

    it('should skip malformed blocks without time codes', () => {
        const srt = `1
Not a time code
Some text

2
00:00:04,000 --> 00:00:06,000
Valid subtitle`;

        const result = parseSrt(srt);
        expect(result).toHaveLength(1);
        expect(result[0].text).toBe('Valid subtitle');
    });

    it('should skip blocks with fewer than 3 lines', () => {
        const srt = `1
00:00:01,000 --> 00:00:03,000

2
00:00:04,000 --> 00:00:06,000
Valid subtitle`;

        const result = parseSrt(srt);
        expect(result).toHaveLength(1);
        expect(result[0].index).toBe(2);
    });

    it('should parse sequential index numbers correctly', () => {
        const srt = `5
00:00:01,000 --> 00:00:03,000
Fifth subtitle

10
00:00:04,000 --> 00:00:06,000
Tenth subtitle`;

        const result = parseSrt(srt);
        expect(result).toHaveLength(2);
        expect(result[0].index).toBe(5);
        expect(result[1].index).toBe(10);
    });

    it('should handle carriage returns properly', async () => {
        const actual = parseSrt(`5\r\n00:00:01,000 --> 00:00:03,000\r\nFirst`);
        expect(actual).toEqual([{ endTime: 3, index: 5, startTime: 1, text: 'First' }]);
    });
});
