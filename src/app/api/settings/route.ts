import { type NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settingsManager';
import type { PromptSettings } from '@/types';

export const GET = async () => {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error reading settings:', error);
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const settings: PromptSettings = await req.json();
        await saveSettings(settings);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
};
