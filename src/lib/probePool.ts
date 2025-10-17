import os from 'node:os';
import { FFmpeggy } from '@/lib/ffmpegConfig';

export type ProbeOk = { path: string; ok: true; durationSec: number; sizeByte: number };
export type ProbeErr = { path: string; ok: false; error: string };
export type ProbeResult = ProbeOk | ProbeErr;

function defaultWorkers() {
    const n = os.cpus()?.length ?? 2;
    return Math.max(2, Math.min(n, 6)); // 2..6 workers is a good sweet spot
}

/**
 * Probe many files with a bounded concurrency pool.
 * Results are returned in the same order as `paths`.
 */
export async function probeMany(paths: string[], maxConcurrent = defaultWorkers()) {
    if (!paths.length) {
        return [];
    }

    const queue = paths.slice(); // shallow copy
    const out: ProbeResult[] = new Array(paths.length);
    const indexByPath = new Map(paths.map((p, i) => [p, i]));
    const workers: Promise<void>[] = [];

    const worker = async () => {
        for (;;) {
            const next = queue.shift();
            if (!next) {
                break;
            }

            const idx = indexByPath.get(next)!;
            try {
                const meta = await FFmpeggy.probe(next);
                const dur = parseFloat(meta.format?.duration ?? '0');
                const size = parseInt(meta.format?.size ?? '0', 10);
                out[idx] = {
                    durationSec: Number.isFinite(dur) ? dur : 0,
                    ok: true,
                    path: next,
                    sizeByte: Number.isFinite(size) ? size : 0,
                };
            } catch (e: any) {
                out[idx] = { error: e?.message ?? String(e), ok: false, path: next };
            }
        }
    };

    for (let i = 0; i < maxConcurrent; i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
    return out;
}
