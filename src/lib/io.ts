import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Writes the file atomically so in case there is a failure it does not result in partial writes with a corrupt file.
 */
export const writeAtomicJson = async (filePath: string, data: any) => {
    if (!data) {
        throw new Error('Invalid payload');
    }

    const tmp = path.format({ dir: os.tmpdir(), ext: '.tmp', name: performance.now().toString() });

    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, filePath);
};
