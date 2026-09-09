import { useCallback, useEffect, useRef } from 'react';

// Survives nested inline-component remounts (e.g. FlightSearch AirportDropdown).
let lockedScrollY = 0;

function rememberScrollPosition() {
    if (typeof window === 'undefined') return 0;
    lockedScrollY = window.scrollY;
    return lockedScrollY;
}

function getLockedScrollPosition(fallbackRef) {
    const refValue = fallbackRef?.current;
    if (refValue) return refValue;
    return lockedScrollY;
}

/**
 * Keeps the page scroll position stable when a search dropdown opens and
 * focuses the search input without triggering browser scroll-into-view.
 */
export function useDropdownScrollLock(isOpen, focusRef, scrollContainerRef) {
    const savedScrollYRef = useRef(0);

    const captureScrollBeforeOpen = useCallback(() => {
        savedScrollYRef.current = rememberScrollPosition();
    }, []);

    const openDropdown = useCallback((openFn) => {
        savedScrollYRef.current = rememberScrollPosition();
        openFn?.();
    }, []);

    const handleOpenClick = useCallback((e, openFn) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        savedScrollYRef.current = rememberScrollPosition();
        openFn?.();
    }, []);

    const createOpenChangeHandler = useCallback((setOpen) => {
        return (open) => {
            if (open) {
                savedScrollYRef.current = rememberScrollPosition();
            }
            setOpen(open);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const targetY = getLockedScrollPosition(savedScrollYRef);
        savedScrollYRef.current = targetY;

        if (scrollContainerRef?.current) {
            scrollContainerRef.current.scrollTop = 0;
        }

        const restoreScroll = () => {
            window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
        };

        restoreScroll();
    }, [isOpen, focusRef, scrollContainerRef]);

    return {
        captureScrollBeforeOpen,
        openDropdown,
        handleOpenClick,
        createOpenChangeHandler,
    };
}
