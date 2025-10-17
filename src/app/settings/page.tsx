'use client';

import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import GlowText from '@/components/cuicui/glow-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PromptSettings } from '@/types';

const SettingsPage = () => {
    const router = useRouter();
    const [settings, setSettings] = useState<PromptSettings>({ contentCriteria: '', priorityGuidelines: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                const data = await response.json();
                setSettings(data);
            } catch (error) {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                body: JSON.stringify(settings),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (response.ok) {
                toast.success('Settings saved successfully');
            } else {
                toast.error('Failed to save settings');
            }
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
                <p className="text-slate-400">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto max-w-4xl px-4 py-16">
                <div className="mb-8">
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        className="mb-4 text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <GlowText className="mb-2 py-2 font-bold text-4xl">Analysis Settings</GlowText>
                    <p className="text-slate-400">
                        Customize the criteria and priorities for subtitle content analysis
                    </p>
                </div>

                <div className="space-y-6">
                    <Card className="border-slate-800 bg-slate-900/50 p-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="criteria" className="mb-2 block font-medium text-white">
                                    Content Criteria
                                </Label>
                                <p className="mb-3 text-slate-400 text-sm">
                                    Define what types of content should be flagged during analysis. List each criterion
                                    on a new line.
                                </p>
                                <Textarea
                                    id="criteria"
                                    value={settings.contentCriteria}
                                    onChange={(e) =>
                                        setSettings((prev) => ({ ...prev, contentCriteria: e.target.value }))
                                    }
                                    rows={10}
                                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                                    placeholder="1. Adult relationships (kissing, romantic/sexual content, dating)&#10;2. Bad morals or unethical behavior&#10;..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="priorities" className="mb-2 block font-medium text-white">
                                    Priority Guidelines
                                </Label>
                                <p className="mb-3 text-slate-400 text-sm">
                                    Define how to classify flagged content by priority (HIGH, MEDIUM, LOW). Include
                                    examples for clarity.
                                </p>
                                <Textarea
                                    id="priorities"
                                    value={settings.priorityGuidelines}
                                    onChange={(e) =>
                                        setSettings((prev) => ({ ...prev, priorityGuidelines: e.target.value }))
                                    }
                                    rows={12}
                                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                                    placeholder="Priority Guidelines:&#10;- HIGH: Major issues...&#10;- MEDIUM: Moderate concerns...&#10;- LOW: Minor issues..."
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="border-slate-700 bg-slate-800 hover:bg-slate-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
