"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [stage, setStage] = useState(0);
  const [hexDump, setHexDump] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
// Check if booted in this session
    let isBooted = false;
    try {
      isBooted = sessionStorage.getItem('booted') === 'true';
    } catch (e) {
      console.warn('sessionStorage access denied', e);
    }

    if (isBooted) {
      setIsVisible(false);
      return;
    }

    const sequence = async () => {
      // Stage 0: 0-120ms (Blinking cursor)
      await new Promise(r => setTimeout(r, 120));
      setStage(1); // SYSTEM BOOT

      await new Promise(r => setTimeout(r, 120));
      setStage(2); // INITIALIZING

      await new Promise(r => setTimeout(r, 120));
      setStage(3); // LOADING SECURITY PROTOCOLS

      await new Promise(r => setTimeout(r, 120));
      setStage(4); // MOUNTING ROOT FILESYSTEM

      await new Promise(r => setTimeout(r, 120));
      setStage(5); // BYPASSING MAINFRAME FIREWALL

      await new Promise(r => setTimeout(r, 120));
      setStage(6); // DECRYPTING PORTFOLIO ASSETS

      await new Promise(r => setTimeout(r, 120));
      setStage(7); // ESTABLISHING ENCRYPTED CHANNEL

      await new Promise(r => setTimeout(r, 120));
      setStage(8); // Start progress bar & hex scroll

      // Simulate progress bar and hex dump
      const duration = 800;
      const interval = 50;
      const steps = duration / interval;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        setProgress(Math.min(100, (step / steps) * 100));

        // Generate random hex line
        const line = Array.from({ length: 6 }).map(() =>
          '0x' + Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0')
        ).join(' ');

        setHexDump(prev => [...prev.slice(-4), line]);

        if (step >= steps) {
          clearInterval(timer);
          setStage(9); // ACCESS GRANTED
        }
      }, interval);

      await new Promise(r => setTimeout(r, duration + 400)); // Wait for bar + 400ms display of ACCESS GRANTED
      setStage(10); // Fade out text

      await new Promise(r => setTimeout(r, 300));
      setStage(11); // Trigger exit animation

      await new Promise(r => setTimeout(r, 500));
      try {
        sessionStorage.setItem('booted', 'true');
      } catch (e) {
        console.warn('sessionStorage access denied', e);
      }
      setIsVisible(false); // Unmount
    };

    sequence();
  }, []); // intentionally only run once

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] bg-black text-green font-mono flex flex-col items-center justify-center p-8 overflow-hidden"
        exit={{ clipPath: 'inset(100% 0 0 0)' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        <motion.div
          className="w-full max-w-3xl flex flex-col items-start space-y-4"
          animate={{ opacity: stage >= 10 ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
          aria-atomic="false"
        >
          {stage >= 0 && (
            <div className="flex">
              {stage === 0 && <span className="w-[10px] h-[18px] bg-cyan animate-pulse" />}
            </div>
          )}

          {stage >= 1 && (
            <div className="flex text-sm md:text-base text-cyan font-bold mb-4">
              <span className="mr-2">&gt;</span>
              <Typewriter text="SYSTEM BOOT SEQUENCE INITIATED..." speed={20} />
            </div>
          )}

          {stage >= 2 && (
            <div className="flex text-sm md:text-base">
              <span className="mr-2">&gt;</span>
              <Typewriter text="INITIALIZING STHITAPRAJNA_BISWAL.sh..." speed={30} />
            </div>
          )}

          {stage >= 3 && (
            <div className="flex text-sm md:text-base">
              <span className="mr-2">&gt;</span>
              <Typewriter text="LOADING SECURITY PROTOCOLS..." speed={20} />
            </div>
          )}

          {stage >= 4 && (
            <div className="flex text-sm md:text-base">
              <span className="mr-2">&gt;</span>
              <Typewriter text="MOUNTING ROOT FILESYSTEM..." speed={20} />
            </div>
          )}

          {stage >= 5 && (
            <div className="flex text-sm md:text-base text-yellow-500">
              <span className="mr-2">&gt;</span>
              <Typewriter text="BYPASSING MAINFRAME FIREWALL..." speed={30} />
            </div>
          )}

          {stage >= 6 && (
            <div className="flex text-sm md:text-base">
              <span className="mr-2">&gt;</span>
              <Typewriter text="DECRYPTING PORTFOLIO ASSETS..." speed={20} />
            </div>
          )}

          {stage >= 7 && (
            <div className="flex text-sm md:text-base">
              <span className="mr-2">&gt;</span>
              <Typewriter text="ESTABLISHING ENCRYPTED CHANNEL..." speed={20} />
            </div>
          )}

          {stage >= 8 && stage < 9 && (
            <div className="w-full flex flex-col mt-8">
              <div className="h-24 overflow-hidden mb-4 opacity-50 text-xs">
                {hexDump.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <div className="w-full h-[3px] bg-[#111] relative">
                <div
                  className="absolute top-0 left-0 h-full bg-cyan transition-all ease-linear"
                  style={{ width: `${progress}%`, transitionDuration: '50ms' }}
                />
              </div>
            </div>
          )}

          {stage >= 9 && (
            <div className="text-green mt-8 text-xl font-bold shadow-[var(--glow-green-sm)]" style={{ textShadow: '0 0 10px var(--color-green)' }}>
              ACCESS GRANTED
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper component for typing text
function Typewriter({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, speed);
      }
    };

    timeoutId = setTimeout(typeNextChar, speed);

    return () => clearTimeout(timeoutId);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}