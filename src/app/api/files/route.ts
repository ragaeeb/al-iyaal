import { promises as fs } from 'node:fs';
import { type NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
        return new NextResponse('File path is required', { status: 400 });
    }

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return new NextResponse(content, { headers: { 'Content-Type': 'text/plain' } });
    } catch (error) {
        console.error(error);
        return new NextResponse('File not found', { status: 404 });
    }
};
