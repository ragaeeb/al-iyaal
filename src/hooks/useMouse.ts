import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

type MouseState = {
    x: number | null;
    y: number | null;
    elementX: number | null;
    elementY: number | null;
    elementPositionX: number | null;
    elementPositionY: number | null;
};

export function useMouse(
    containerRef?: RefObject<HTMLElement | SVGElement | null>,
): [MouseState, RefObject<HTMLDivElement | null>] {
    const [state, setState] = useState<MouseState>({
        elementPositionX: null,
        elementPositionY: null,
        elementX: null,
        elementY: null,
        x: null,
        y: null,
    });

    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        let rafId: number | null = null;
        let latestEvent: MouseEvent | null = null;

        const handleMouseMove = (event: MouseEvent) => {
            latestEvent = event;

            if (rafId !== null) {
                return;
            }

            rafId = requestAnimationFrame(() => {
                if (!latestEvent) {
                    return;
                }

                const newState: Partial<MouseState> = { x: latestEvent.pageX, y: latestEvent.pageY };

                if (containerRef?.current instanceof Element) {
                    const { left, top } = containerRef.current.getBoundingClientRect();
                    const containerPositionX = left + window.scrollX;
                    const containerPositionY = top + window.scrollY;
                    const containerX = latestEvent.pageX - containerPositionX;
                    const containerY = latestEvent.pageY - containerPositionY;

                    newState.elementX = containerX;
                    newState.elementY = containerY;
                    newState.elementPositionX = containerPositionX;
                    newState.elementPositionY = containerPositionY;
                } else if (ref.current instanceof Element) {
                    const { left, top } = ref.current.getBoundingClientRect();
                    const elementPositionX = left + window.scrollX;
                    const elementPositionY = top + window.scrollY;
                    const elementX = latestEvent.pageX - elementPositionX;
                    const elementY = latestEvent.pageY - elementPositionY;

                    newState.elementX = elementX;
                    newState.elementY = elementY;
                    newState.elementPositionX = elementPositionX;
                    newState.elementPositionY = elementPositionY;
                }

                setState((s) => ({ ...s, ...newState }));
                latestEvent = null;
                rafId = null;
            });
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [containerRef]);

    return [state, ref];
}
