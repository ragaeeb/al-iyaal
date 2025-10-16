import { type NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/ai/gemini';
import { ApiKeyManager } from '@/lib/apiKeyManager';

type SubtitleEntry = { startTime: number; endTime: number; text: string };

type FlaggedSubtitle = { startTime: number; endTime: number; text: string; reason: string };

const keyManager = new ApiKeyManager(process.env.GOOGLE_API_KEY!);

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

export const POST = async (req: NextRequest) => {
    try {
        const { subtitles }: { subtitles: SubtitleEntry[] } = await req.json();

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
                    const subtitleText = subtitles
                        .map((sub) => `[${sub.startTime.toFixed(2)}s - ${sub.endTime.toFixed(2)}s]: ${sub.text}`)
                        .join('\n');

                    const prompt = `You are analyzing subtitle content for a children's video to identify inappropriate material. Analyze the following subtitles and flag any content that contains:

1. Adult relationships (kissing, romantic/sexual content, dating)
2. Bad morals or unethical behavior
3. Content against Islamic values and aqeedah (belief system)
4. Magic, sorcery, or supernatural practices
5. Music references or musical performances
6. Violence or frightening content
7. Inappropriate language or themes

For each problematic subtitle, identify the exact timestamp and provide a brief reason for flagging it.

Subtitles:
${subtitleText}

Respond ONLY with a valid JSON array in this exact format, with no additional text or markdown:
[
  {
    "startTime": 12.5,
    "endTime": 15.3,
    "text": "subtitle text here",
    "reason": "brief explanation"
  }
]

If no issues are found, respond with an empty array: []`;

                    send({ status: 'analyzing' });
                    const text = await generateWithGemini(prompt, keyManager.getNext(), (responseText) => {
                        try {
                            const sanitized = sanitizeResponse(responseText);
                            JSON.parse(sanitized);
                            return true;
                        } catch {
                            return false;
                        }
                    });

                    const flagged: FlaggedSubtitle[] = JSON.parse(sanitizeResponse(text!));
                    send({ complete: true, flagged });
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
