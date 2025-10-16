import type React from 'react';
import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';

type SubmittableInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'onSubmit'> & {
    name: string;
    onSubmit: (value: string) => void;
};

const SubmittableInputComponent = (
    { name, onSubmit, ...rest }: SubmittableInputProps,
    ref: React.Ref<HTMLInputElement>,
) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const value = (data.get(name) as string)?.trim() || '';
        onSubmit(value);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input ref={ref} name={name} {...rest} />
        </form>
    );
};

export const SubmittableInput = forwardRef<HTMLInputElement, SubmittableInputProps>(SubmittableInputComponent);

export default SubmittableInput;
