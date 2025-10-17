import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GrowingButton({
    children,
    className,
    hoverText,
    ...props
}: { children: ReactNode; className?: string; hoverText: string } & ComponentProps<'button'>) {
    return (
        <button
            className={cn(
                'group flex transform-gpu items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-neutral-400/15 active:bg-neutral-400/25',
                className,
            )}
            type="button"
            {...props}
        >
            {children}
            <span className="w-fit max-w-0 transform-gpu overflow-hidden transition-all duration-500 group-hover:max-w-[12rem] group-focus-visible:max-w-[12rem]">
                <span
                    aria-hidden="true"
                    title={hoverText}
                    className="transform-gpu whitespace-nowrap text-sm opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                    {hoverText}
                </span>
            </span>
        </button>
    );
}
