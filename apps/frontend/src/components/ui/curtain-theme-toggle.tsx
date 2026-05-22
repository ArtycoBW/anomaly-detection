'use client';

import { useState, useCallback, useRef, ReactNode, CSSProperties } from 'react';

export type Theme = 'light' | 'dark';

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export interface CurtainToggleProps {
  defaultTheme?: Theme;
  duration?: number;
  onThemeChange?: (theme: Theme) => void;
  children?: ReactNode;
}

const EASING = 'cubic-bezier(0.76, 0, 0.24, 1)';

export function CurtainThemeToggle({
  defaultTheme = 'dark',
  duration = 500,
  onThemeChange,
  children,
}: CurtainToggleProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isAnimating, setIsAnimating] = useState(false);
  const [curtainVisible, setCurtainVisible] = useState(false);
  const curtainColorRef = useRef('#030308');

  const toggle = useCallback(() => {
    if (isAnimating) return;
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    curtainColorRef.current = next === 'dark' ? '#030308' : '#f5f0e8';
    setIsAnimating(true);
    setCurtainVisible(true);

    setTimeout(() => {
      setTheme(next);
      onThemeChange?.(next);
      if (typeof document !== 'undefined') {
        if (next === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    }, duration * 0.5);

    setTimeout(() => {
      setCurtainVisible(false);
      setTimeout(() => setIsAnimating(false), 100);
    }, duration);
  }, [isAnimating, theme, duration, onThemeChange]);

  const curtainStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: curtainColorRef.current,
    zIndex: 99999,
    pointerEvents: 'none',
    transformOrigin: 'top',
    transform: curtainVisible ? 'scaleY(1)' : 'scaleY(0)',
    transition: curtainVisible
      ? `transform ${duration}ms ${EASING}`
      : `transform ${duration * 0.8}ms ${EASING}`,
  };

  return (
    <>
      <div aria-hidden="true" style={curtainStyle} />
      <button
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 border border-cyan-500/20 bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
      {children}
    </>
  );
}
