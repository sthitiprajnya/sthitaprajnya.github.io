"use client";
import React, { useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useInView } from 'react-intersection-observer';
import clsx from 'clsx';

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlitchText({ children, className, style }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView({ threshold: 0 });

  // BOLT: Only schedule background glitches when the component is in the viewport
  // to prevent unnecessary state updates and re-renders when the user has scrolled past.
  useEffect(() => {
    if (prefersReducedMotion || !inView) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextGlitch = () => {
      const delay = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
      return setTimeout(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
        if (!document.hidden) {
          timeoutId = scheduleNextGlitch();
        }
      }, delay);
    };

    const stopGlitchTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const handleVisibilityChange = () => {
      // BOLT: Pause the glitch timer when tab is inactive to save CPU
      if (document.hidden) {
        stopGlitchTimer();
      } else {
        if (!timeoutId) {
          timeoutId = scheduleNextGlitch();
        }
      }
    };

    if (!document.hidden) {
      timeoutId = scheduleNextGlitch();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopGlitchTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [prefersReducedMotion, inView]);

  if (prefersReducedMotion) {
    return <span className={className} style={style}>{children}</span>;
  }

  return (
    <div
      ref={ref}
      className={clsx('relative inline-block', className)}
      style={style}
      onMouseEnter={() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);
      }}
    >
      <span className="relative z-10 inherit-text-styles">{children}</span>
      {isGlitching && (
        <>
          <span
            className="absolute top-0 left-0 z-0 opacity-80"
            style={{ animation: 'glitch-layer-1 0.2s linear infinite' }}
            aria-hidden="true"
          >
            {children}
          </span>
          <span
            className="absolute top-0 left-0 z-0 opacity-80"
            style={{ animation: 'glitch-layer-2 0.3s linear infinite' }}
            aria-hidden="true"
          >
            {children}
          </span>
        </>
      )}
    </div>
  );
}