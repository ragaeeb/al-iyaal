import { ArrowLeftIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export default function CallToAction({
    children,
    className,
    pillText,
    ...props
}: { children: ReactNode; className?: string; pillText: string } & ComponentProps<'button'>) {
    return (
        <Button
            className="group relative flex flex-row items-center gap-2 overflow-hidden rounded-full border border-neutral-400/15 bg-neutral-400/5 p-1 pr-3 text-sm shadow-2xs transition duration-100 hover:border-neutral-400/30 hover:bg-neutral-400/10 hover:shadow-2xs focus-visible:rounded-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-600"
            {...props}
        >
            <ArrowLeftIcon className="size-5 text-neutral-500 transition-transform duration-100 group-hover:translate-x-1 dark:text-neutral-400" />
            <span className="text-neutral-500 dark:text-neutral-400">{children}</span>
            <div className="inline-flex items-center rounded-full border border-violet-400/20 bg-brand bg-violet-400/20 px-3 py-1 text-sm text-violet-600 dark:text-violet-300">
                {pillText}
            </div>
            <div className="-z-10 absolute inset-0 overflow-hidden rounded-full bg-linear-to-br from-violet-100 to-violet-300 opacity-70 backdrop-blur-md transition-opacity group-hover:opacity-100" />
        </Button>
    );
}
