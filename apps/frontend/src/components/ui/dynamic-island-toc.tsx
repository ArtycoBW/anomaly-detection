'use client';

import { useState, useEffect, ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type HeadingData = {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
};

function CircleProgress({ percentage }: { percentage: number }) {
  const size = 22;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,255,209,0.12)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#00FFD1" strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </svg>
  );
}

type DynamicIslandTOCProps = {
  children?: ReactNode;
  selector?: string;
};

export function DynamicIslandTOC({
  children,
  selector = 'article h1, article h2, article h3, .toc-target',
}: DynamicIslandTOCProps) {
  const [headings, setHeadings] = useState<HeadingData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
      const valid = elements
        .filter((el) => !el.hasAttribute('data-toc-ignore'))
        .map((el, i) => {
          if (!el.id) {
            el.id = el.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `toc-${i}`;
          }
          const level = el.tagName?.startsWith('H') ? parseInt(el.tagName[1]) : 2;
          return { id: el.id, text: el.textContent || 'Section', level, element: el };
        });
      valid.sort((a, b) =>
        a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      );
      setHeadings(valid);
    }, 100);
    return () => clearTimeout(timer);
  }, [selector]);

  useEffect(() => {
    const onScroll = () => {
      let active: string | null = null;
      for (const h of headings) {
        if (h.element.getBoundingClientRect().top <= 100) active = h.id;
        else break;
      }
      if (!active && headings[0]) active = headings[0].id;
      setActiveId(active);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  const activeHeading = headings.find((h) => h.id === activeId);
  const minLevel = useMemo(() => headings.length ? Math.min(...headings.map((h) => h.level)) : 1, [headings]);

  return (
    <>
      {children}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
      >
        <motion.div
          onClick={() => !isExpanded && setIsExpanded(true)}
          animate={{
            width: isExpanded ? 320 : 260,
            height: isExpanded ? 380 : 48,
            borderRadius: isExpanded ? 20 : 24,
          }}
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
          style={{ cursor: isExpanded ? 'default' : 'pointer' }}
          className="relative overflow-hidden border border-cyan-500/20 bg-[#0d0d1f]/95 shadow-2xl shadow-black/60"
        >
          {/* Closed pill */}
          <motion.div
            animate={{ opacity: isExpanded ? 0 : 1, scale: isExpanded ? 0.95 : 1 }}
            transition={{ duration: 0.25 }}
            className={cn('absolute inset-0 flex items-center gap-3 px-4', isExpanded && 'pointer-events-none')}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00FFD1] shrink-0" />
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={activeId}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="block truncate text-xs font-medium text-slate-300 font-mono"
                >
                  {activeHeading?.text || 'Содержание'}
                </motion.span>
              </AnimatePresence>
            </div>
            <CircleProgress percentage={progress} />
          </motion.div>

          {/* Expanded menu */}
          <motion.div
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.25, delay: isExpanded ? 0.12 : 0 }}
            className={cn('absolute inset-0 flex flex-col', !isExpanded && 'pointer-events-none')}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/10">
              <span className="text-[10px] font-semibold tracking-[0.15em] text-cyan-500/60 uppercase font-mono">
                Навигация
              </span>
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="text-slate-500 hover:text-cyan-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {headings.map((h) => {
                const isActive = activeId === h.id;
                const pl = (h.level - minLevel) * 12 + 10;
                return (
                  <button
                    key={h.id}
                    onMouseEnter={() => setHoveredId(h.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      const y = h.element.getBoundingClientRect().top + window.scrollY - 80;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                      setIsExpanded(false);
                    }}
                    style={{ paddingLeft: pl }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-lg py-1.5 pr-3 text-left text-xs transition-all',
                      isActive ? 'text-cyan-400 font-medium' : 'text-slate-500 hover:text-slate-300',
                      (isActive || hoveredId === h.id) && 'bg-cyan-500/5',
                    )}
                  >
                    <span className="flex-1 truncate">{h.text}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#00FFD1]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}
