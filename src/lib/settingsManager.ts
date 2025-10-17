import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { PromptSettings } from '@/types';

const SETTINGS_FILE = path.join(os.tmpdir(), 'al-iyaal', 'settings.json');

export const DEFAULT_SETTINGS: PromptSettings = {
    contentCriteria: `1. Adult relationships (kissing, romantic/sexual content, dating)
2. Bad morals or unethical behavior
3. Content against Islamic values and aqeedah (belief system)
4. Magic, sorcery, or supernatural practices
5. Music references or musical performances
6. Violence or frightening content
7. Inappropriate language or themes`,
    priorityGuidelines: `Priority Guidelines:
- HIGH: Major issues in aqeedah (celebrating Christmas, promoting shirk), explicit magic/sorcery, sexual content
- MEDIUM: Questionable behavior, offensive language (stupid, dumb), moderate violence, dating/romance
- LOW: Mildly scary content, ambiguous references, minor concerns

Examples:
- "Let's celebrate Christmas!" → HIGH (aqeedah violation)
- "She cast a spell on him" → HIGH (sorcery)
- "You're so stupid!" → MEDIUM (offensive language)
- "That monster looks scary" → LOW (mild fright)`,
};

const ensureSettingsFile = async () => {
    try {
        await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
        await fs.access(SETTINGS_FILE);
    } catch {
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
};

export const getSettings = async (): Promise<PromptSettings> => {
    try {
        await ensureSettingsFile();
        const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading settings:', error);
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = async (settings: PromptSettings): Promise<void> => {
    await ensureSettingsFile();
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};
