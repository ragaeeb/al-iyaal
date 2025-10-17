'use client';

/**
 * @author: @dorian_baffier
 * @description: Attract Button
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { FolderInputIcon } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttractButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    particleCount?: number;
    attractRadius?: number;
    text: string;
    hoverText: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
}

export default function AttractButton({
    className,
    particleCount = 12,
    text,
    hoverText,
    attractRadius = 50,
    ...props
}: AttractButtonProps) {
    const [isAttracting, setIsAttracting] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const particlesControl = useAnimation();

    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 360 - 180,
            y: Math.random() * 360 - 180,
        }));
        setParticles(newParticles);
    }, [particleCount]);

    const handleInteractionStart = useCallback(async () => {
        setIsAttracting(true);
        await particlesControl.start({ transition: { damping: 10, stiffness: 50, type: 'spring' }, x: 0, y: 0 });
    }, [particlesControl]);

    const handleInteractionEnd = useCallback(async () => {
        setIsAttracting(false);
        await particlesControl.start((i) => ({
            transition: { damping: 15, stiffness: 100, type: 'spring' },
            x: particles[i].x ?? 0,
            y: particles[i].y ?? 0,
        }));
    }, [particlesControl, particles]);

    return (
        <Button
            className={cn(
                'relative min-w-40 touch-none',
                'bg-violet-100 dark:bg-violet-900',
                'hover:bg-violet-200 dark:hover:bg-violet-800',
                'text-violet-600 dark:text-violet-300',
                'border border-violet-300 dark:border-violet-700',
                'transition-all duration-300',
                className,
            )}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            {...props}
        >
            {particles.map((p, index) => (
                <motion.div
                    key={p.id}
                    custom={index}
                    initial={{ x: p.x, y: p.y }}
                    animate={particlesControl}
                    className={cn(
                        'pointer-events-none absolute h-1.5 w-1.5 rounded-full',
                        'bg-violet-400 dark:bg-violet-300',
                        'transition-opacity duration-300',
                        isAttracting ? 'opacity-100' : 'opacity-40',
                    )}
                    aria-hidden
                />
            ))}
            <span className="relative flex w-full items-center justify-center gap-2">
                <FolderInputIcon
                    aria-hidden
                    className={cn('h-4 w-4 transition-transform duration-300', isAttracting && 'scale-110')}
                />
                {isAttracting ? hoverText : text}
            </span>
        </Button>
    );
}
