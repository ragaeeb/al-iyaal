import { type NextRequest, NextResponse } from 'next/server';
import { GeminiModel, generateWithGemini } from '@/lib/ai/gemini';
import { ApiKeyManager } from '@/lib/apiKeyManager';
import { getSettings } from '@/lib/settingsManager';
import type { AnalysisResult, AnalysisStrategy, SubtitleEntry } from '@/types';

type MinimalSubtitle = { startTime: number; text: string };

const keyManager = new ApiKeyManager(process.env.GOOGLE_API_KEY || []);

const sanitizeResponse = (text: string): string => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    return cleaned.trim();
};

const validateResponse = (responseText: string) => {
    try {
        const sanitized = sanitizeResponse(responseText);
        const parsed = JSON.parse(sanitized);
        return parsed && Array.isArray(parsed.flagged) && typeof parsed.summary === 'string';
    } catch {
        return false;
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const { subtitles, strategy }: { subtitles: SubtitleEntry[]; strategy: AnalysisStrategy } = await req.json();

        if (!subtitles || subtitles.length === 0) {
            return NextResponse.json({ error: 'No subtitles provided' }, { status: 400 });
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    const settings = await getSettings();

                    const minimalSubtitles: MinimalSubtitle[] = subtitles.map((sub) => ({
                        startTime: sub.startTime,
                        text: sub.text,
                    }));

                    const subtitleText = minimalSubtitles
                        .map((sub) => `[${sub.startTime.toFixed(2)}s]: ${sub.text}`)
                        .join('\n');

                    const prompt = `You are analyzing subtitle content for a children's video to identify inappropriate material. Analyze the following subtitles and flag any content that contains:

${settings.contentCriteria}

${settings.priorityGuidelines}

For each problematic subtitle, identify the exact timestamp, assign a priority level, and provide a brief reason for flagging it.

Additionally, provide a summary of the overall storyline based on the subtitles.

Subtitles:
${subtitleText}

Respond ONLY with a valid JSON object in this exact format, with no additional text or markdown:
{
  "flagged": [
    {
      "startTime": 12.5,
      "reason": "brief explanation",
      "priority": "high"
    }
  ],
  "summary": "Brief storyline summary based on all subtitles"
}

If no issues are found, respond with: {"flagged": [], "summary": "your summary here"}`;

                    send({ status: 'analyzing' });
                    const text = await generateWithGemini(
                        prompt,
                        keyManager.getNext(),
                        validateResponse,
                        strategy === 'deep' ? GeminiModel.ProV2_5 : GeminiModel.FlashLiteV2_5,
                    );

                    const result: AnalysisResult = JSON.parse(sanitizeResponse(text!));

                    const flaggedWithFullData = result.flagged.map((item) => {
                        const originalSub = subtitles.find((s) => Math.abs(s.startTime - item.startTime) < 0.1);
                        return {
                            endTime: originalSub?.endTime || item.startTime + 1,
                            priority: item.priority,
                            reason: item.reason,
                            startTime: item.startTime,
                            text: originalSub?.text || '',
                        };
                    });

                    send({ complete: true, flagged: flaggedWithFullData, summary: result.summary });
                } catch (error) {
                    send({ error: error instanceof Error ? error.message : 'Analysis failed' });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Content-Type': 'text/event-stream' },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to analyze subtitles' }, { status: 500 });
    }
};
