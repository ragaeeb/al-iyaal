'use client';

/**
 * @author: @dorian_baffier
 * @description: Sliced Text
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SlicedTextProps {
    text: string;
    className?: string;
    containerClassName?: string;
    splitSpacing?: number;
}

const SlicedText: React.FC<SlicedTextProps> = ({
    text = 'Sliced Text',
    className = '',
    containerClassName = '',
    splitSpacing = 2,
}) => {
    return (
        <motion.div
            className={cn('relative inline-block w-full', containerClassName)}
            whileHover="hover"
            initial="default"
        >
            <motion.div
                className={cn('-ml-0.5 absolute w-full', className)}
                variants={{
                    default: { clipPath: 'inset(0 0 50% 0)', opacity: 1, y: -splitSpacing / 2 },
                    hover: { clipPath: 'inset(0 0 0 0)', opacity: 0, y: 0 },
                }}
                transition={{ duration: 0.1 }}
            >
                {text}
            </motion.div>
            <motion.div
                className={cn('absolute w-full', className)}
                variants={{
                    default: { clipPath: 'inset(50% 0 0 0)', opacity: 1, y: splitSpacing / 2 },
                    hover: { clipPath: 'inset(0 0 0 0)', opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.1 }}
            >
                {text}
            </motion.div>

            <div className={cn('invisible', className)}>{text}</div>
        </motion.div>
    );
};

export default SlicedText;
