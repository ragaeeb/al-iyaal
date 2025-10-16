import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DotsPattern } from '@/components/cuicui/dots-pattern';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = { description: 'Video Editor', title: 'al-Iyāl' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className="dark">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <main>
                    <DotsPattern
                        className={cn('[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]')}
                    />
                    {children}
                    <Footer />
                </main>
                <Toaster />
            </body>
        </html>
    );
}
