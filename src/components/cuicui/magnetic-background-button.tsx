'use client';

import { type ComponentProps, type MouseEvent, type ReactNode, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

type PositionType = { x: number; y: number };

export function MagneticBackgroundButton({
    children,
    magneticStrength = 0.5,
    className,
    exitForce = 20,
    ...props
}: {
    children: ReactNode;
    magneticStrength?: number;
    className?: string;
    exitForce?: number;
} & ComponentProps<'button'>) {
    const [position, setPosition] = useState<PositionType>({ x: 0, y: 0 });
    const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current) {
            return;
        }
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
        const maxDistance = Math.max(rect.width, rect.height);

        // Normalize the direction vector
        const unitX = distanceX / distance;
        const unitY = distanceY / distance;

        // Clamp the distance to maxDistance
        const clampedDistance = Math.min(distance, maxDistance);

        // Calculate the magnetic effect
        const magneticMagnitude = (clampedDistance / maxDistance) * magneticStrength * (rect.width / 4);

        const magneticX = unitX * magneticMagnitude;
        const magneticY = unitY * magneticMagnitude;

        setPosition({ x: magneticX, y: magneticY });
        setLastMousePosition({ x: e.clientX, y: e.clientY });
    };

    function getFarAwayLastPosition() {
        if (!(buttonRef.current && lastMousePosition)) {
            return { x: 0, y: 0 };
        }
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate direction from the cursor to the button center
        const distanceX = centerX - lastMousePosition.x;
        const distanceY = centerY - lastMousePosition.y;

        const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

        if (distance === 0) {
            return { x: 0, y: 0 };
        }

        // Normalize the direction vector
        const unitX = distanceX / distance;
        const unitY = distanceY / distance;

        // Calculate the new position
        const farAwayX = unitX * exitForce;
        const farAwayY = unitY * exitForce;

        return { x: -farAwayX, y: -farAwayY };
    }

    function getTransformedValue() {
        return `translate3D(${position.x}px, ${position.y}px, 0)`;
    }

    return (
        <Button
            variant="plain"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => {
                setIsHovered(true);
                const farAwayPosition = getFarAwayLastPosition();
                setPosition(farAwayPosition);
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                const farAwayPosition = getFarAwayLastPosition();
                setPosition(farAwayPosition);
            }}
            ref={buttonRef}
            className={cn(
                'relative z-10 inline-flex items-center justify-center rounded-lg px-3 py-2 font-medium text-neutral-600 tracking-tight dark:text-neutral-200',
                className,
            )}
            {...props}
        >
            <span
                className={cn(
                    '-z-10 pointer-events-none absolute inset-0 rounded-lg',
                    'before:absolute before:inset-0 before:rounded-lg before:transition-all',
                    'before:bg-neutral-200 dark:before:bg-neutral-800',
                    isHovered ? 'duration-150 ease-out' : 'duration-100 ease-in',
                    isHovered
                        ? 'before:scale-100 before:opacity-100 before:duration-100 before:ease-in'
                        : 'before:scale-90 before:opacity-0 before:blur-md before:duration-300 before:ease-out',
                )}
                style={{ transform: getTransformedValue() }}
            />
            {children}
        </Button>
    );
}
