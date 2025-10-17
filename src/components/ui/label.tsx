'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import React from 'react';

import { cn } from '@/lib/utils';

const Label = React.forwardRef<
    React.ComponentRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            ref={ref}
            className={cn(
                'flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
                className,
            )}
            {...props}
        />
    );
});

Label.displayName = 'Label';

export { Label };
