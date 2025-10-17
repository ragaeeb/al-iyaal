'use client';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ScrambleHoverProps = React.ComponentProps<typeof motion.span> & {
    text: string;
    scrambleSpeed?: number;
    maxIterations?: number;
    sequential?: boolean;
    revealDirection?: 'start' | 'end' | 'center';
    useOriginalCharsOnly?: boolean;
    characters?: string;
    scrambledClassName?: string;
};

const ScrambleHover = ({
    text,
    scrambleSpeed = 50,
    maxIterations = 10,
    useOriginalCharsOnly = false,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
    className,
    scrambledClassName,
    sequential = false,
    revealDirection = 'start',
    ...props
}: ScrambleHoverProps) => {
    const [displayText, setDisplayText] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const [isScrambling, setIsScrambling] = useState(false);
    const revealedIndices = useRef(new Set<number>());

    useEffect(() => {
        revealedIndices.current.clear();
        setDisplayText(text);
    }, [text]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let currentIteration = 0;

        const getNextIndex = () => {
            switch (revealDirection) {
                case 'start':
                    return getNextIndexFromStart();
                case 'end':
                    return getNextIndexFromEnd();
                case 'center':
                    return getNextIndexFromCenter();
                default:
                    return revealedIndices.current.size;
            }
        };

        const getNextIndexFromStart = () => revealedIndices.current.size;

        const getNextIndexFromEnd = () => text.length - 1 - revealedIndices.current.size;

        const getNextIndexFromCenter = () => {
            const textLength = text.length;
            const middle = Math.floor(textLength / 2);
            const offset = Math.floor(revealedIndices.current.size / 2);
            const nextIndex = revealedIndices.current.size % 2 === 0 ? middle + offset : middle - offset - 1;

            if (nextIndex >= 0 && nextIndex < textLength && !revealedIndices.current.has(nextIndex)) {
                return nextIndex;
            }

            for (let i = 0; i < textLength; i++) {
                if (!revealedIndices.current.has(i)) {
                    return i;
                }
            }
            return 0;
        };

        const shuffleText = (text: string) => {
            if (useOriginalCharsOnly) {
                const positions = text
                    .split('')
                    .map((char, i) => ({
                        char,
                        index: i,
                        isRevealed: revealedIndices.current.has(i),
                        isSpace: char === ' ',
                    }));

                const nonSpaceChars = positions.filter((p) => !(p.isSpace || p.isRevealed)).map((p) => p.char);

                // Shuffle remaining non-revealed, non-space characters
                for (let i = nonSpaceChars.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [nonSpaceChars[i], nonSpaceChars[j]] = [nonSpaceChars[j], nonSpaceChars[i]];
                }

                let charIndex = 0;
                return positions
                    .map((p) => {
                        if (p.isSpace) {
                            return ' ';
                        }
                        if (p.isRevealed) {
                            return text[p.index];
                        }
                        return nonSpaceChars[charIndex++];
                    })
                    .join('');
            }
            return text
                .split('')
                .map((char, i) => {
                    if (char === ' ') {
                        return ' ';
                    }
                    if (revealedIndices.current.has(i)) {
                        return text[i];
                    }
                    return availableChars[Math.floor(Math.random() * availableChars.length)];
                })
                .join('');
        };

        const availableChars = useOriginalCharsOnly
            ? Array.from(new Set(text.split(''))).filter((char) => char !== ' ')
            : characters.split('');

        if (isHovering) {
            setIsScrambling(true);
            interval = setInterval(() => {
                if (sequential) {
                    if (revealedIndices.current.size < text.length) {
                        const nextIndex = getNextIndex();
                        revealedIndices.current.add(nextIndex);
                        setDisplayText(shuffleText(text));
                    } else {
                        clearInterval(interval);
                        setIsScrambling(false);
                    }
                } else {
                    setDisplayText(shuffleText(text));
                    currentIteration++;
                    if (currentIteration >= maxIterations) {
                        clearInterval(interval);
                        setIsScrambling(false);
                        setDisplayText(text);
                    }
                }
            }, scrambleSpeed);
        } else {
            setDisplayText(text);
            revealedIndices.current.clear();
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isHovering, text, characters, scrambleSpeed, useOriginalCharsOnly, sequential, revealDirection, maxIterations]);

    return (
        <motion.span
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
            className={cn('inline-block whitespace-pre-wrap', className)}
            {...props}
        >
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {displayText.split('').map((char, index) => (
                    <span
                        key={`${index}-${char}`}
                        className={cn(
                            revealedIndices.current.has(index) || !isScrambling || !isHovering
                                ? className
                                : scrambledClassName,
                        )}
                    >
                        {char}
                    </span>
                ))}
            </span>
        </motion.span>
    );
};

export default ScrambleHover;
