import { memo } from 'react';
import { cn } from '@/lib/utils';

export type SimpleModernSliderProps = {
    /** Current value of the slider */
    value: number;
    /** Minimum value (default: 0) */
    min?: number;
    /** Maximum value */
    max: number;
    /** Step increment (default: 0.1) */
    step?: number;
    /** Callback when value changes */
    onChange: (newValue: number) => void;
    /** Whether the slider is disabled */
    disabled?: boolean;
    /** Accessible label for screen readers */
    ariaLabel?: string;
    /** Additional CSS classes for the wrapper div */
    className?: string;
    /** Additional CSS classes for the input element */
    inputClassName?: string;
    /** Unique ID for the input element */
    id?: string;
};

export const SimpleModernSlider = memo<SimpleModernSliderProps>(
    ({
        value,
        min = 0,
        max,
        step = 0.1,
        onChange,
        disabled = false,
        ariaLabel = 'Slider',
        className,
        inputClassName,
        id,
    }) => {
        return (
            <div className={cn('flex-1', className)}>
                <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(Number(e.target.value))}
                    aria-orientation="horizontal"
                    aria-label={ariaLabel}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    className={cn(
                        'w-full cursor-col-resize appearance-none bg-transparent outline-hidden transition-all focus:outline-hidden active:scale-105',
                        'disabled:pointer-events-none disabled:opacity-50',
                        // Mozilla Firefox styles
                        '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-1 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-slate-200',
                        '[&::-moz-range-track]:h-8 [&::-moz-range-track]:w-full [&::-moz-range-track]:rounded-xl [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-slate-800 [&::-moz-range-track]:px-2 [&::-moz-range-track]:transition-all',
                        'active:[&::-moz-range-track]:bg-slate-700',
                        // WebKit (Chrome, Safari, Edge) styles
                        '[&::-webkit-slider-runnable-track]:h-8 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:rounded-xl [&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-runnable-track]:px-2 [&::-webkit-slider-runnable-track]:py-2',
                        'active:[&::-webkit-slider-runnable-track]:bg-slate-700',
                        '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-slate-200',
                        inputClassName,
                    )}
                />
            </div>
        );
    },
);

SimpleModernSlider.displayName = 'SimpleModernSlider';
