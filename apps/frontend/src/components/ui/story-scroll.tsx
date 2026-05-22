'use client';

import React, { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react';

function cx(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(' ');
}

export interface FlowSectionProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  'aria-label'?: string;
}

export const FlowSection: React.FC<FlowSectionProps> = ({
  className, style = {}, children, 'aria-label': ariaLabel,
}) => (
  <section
    data-flow-section
    aria-label={ariaLabel}
    className={cx('relative min-h-screen w-full overflow-hidden', className)}
  >
    <div
      data-flow-inner
      className={cx(
        'flow-art-container relative flex min-h-screen w-full flex-col justify-between gap-6',
        'px-[5vw] pt-[clamp(3rem,8vw,5rem)] pb-[5vw]',
        'will-change-transform',
      )}
      style={{ transformOrigin: 'bottom left', ...style }}
    >
      {children}
    </div>
  </section>
);

export interface FlowArtProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const FlowArt: React.FC<FlowArtProps> = ({
  children, className, 'aria-label': ariaLabel = 'Story scroll',
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let gsap: any, ScrollTrigger: any;

    async function init() {
      try {
        const gsapMod = await import('gsap');
        const stMod = await import('gsap/ScrollTrigger');
        gsap = gsapMod.gsap;
        ScrollTrigger = stMod.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        if (!containerRef.current) return;
        const sections = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>('[data-flow-section]')
        );

        sections.forEach((section, i) => {
          gsap.set(section, { zIndex: i + 1 });
          const inner = section.querySelector<HTMLElement>('.flow-art-container');
          if (!inner) return;

          if (i > 0) {
            gsap.set(inner, { rotation: 28, transformOrigin: 'bottom left' });
            gsap.to(inner, {
              rotation: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'top 20%',
                scrub: true,
              },
            });
          }

          if (i < sections.length - 1) {
            ScrollTrigger.create({
              trigger: section,
              start: 'bottom bottom',
              end: 'bottom top',
              pin: true,
              pinSpacing: false,
            });
          }
        });

        ScrollTrigger.refresh();
      } catch { /* gsap not available */ }
    }

    init();

    return () => {
      if (ScrollTrigger) ScrollTrigger.getAll().forEach((t: any) => t.kill());
    };
  }, [mounted]);

  return (
    <main ref={containerRef} aria-label={ariaLabel} className={cx('w-full overflow-x-hidden', className)}>
      {children}
    </main>
  );
};

export default FlowArt;
