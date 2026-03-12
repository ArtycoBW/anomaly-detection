'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useYear } from '@/context/YearContext';
import { cn } from '@/lib/utils';

const YEARS = [2022, 2023, 2024] as const;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function HeatmapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.6" stroke="currentColor" strokeWidth="1.2" />
      <rect x="14" y="2" width="4" height="5" rx="1" fill="currentColor" opacity="0.9" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.7" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="14" y="8" width="4" height="5" rx="1" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="14" width="5" height="4" rx="1" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="14" width="5" height="4" rx="1" fill="currentColor" opacity="0.9" stroke="currentColor" strokeWidth="1.2" />
      <rect x="14" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ComparisonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 15L6 10L10 12L14 6L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="12" r="1.5" fill="currentColor" />
      <circle cx="14" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 10h8M6 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Обзор', href: '/', icon: <DashboardIcon /> },
  { label: 'Тепловая карта', href: '/analysis/heatmap', icon: <HeatmapIcon /> },
  { label: 'Сравнение методов', href: '/analysis/comparison', icon: <ComparisonIcon /> },
  { label: 'Динамика', href: '/analysis/timeline', icon: <TimelineIcon /> },
  { label: 'AI Отчёт', href: '/report', icon: <ReportIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { year, setYear } = useYear();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 relative">
      {/* Gradient edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent" />

      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white font-bold text-sm">iD</span>
          </div>
          <span className="text-xl font-bold gradient-text">iData</span>
        </Link>
        <button
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-200 relative group',
                active
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent',
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
              )}
              <span className={cn(
                'transition-colors',
                active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300',
              )}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Year selector */}
      <div className="px-4 py-5 border-t border-slate-800/50">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-2">
          Период данных
        </p>
        <div className="flex gap-1 bg-slate-900/80 rounded-xl p-1">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                year === y
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/10 border border-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent',
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Version badge */}
      <div className="px-6 py-3 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 text-center">
          iData Anomaly Detection v1.0
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-900/80 backdrop-blur-lg text-slate-300 hover:text-white border border-slate-700/50 transition-all"
        onClick={() => setMobileOpen(true)}
        aria-label="Открыть меню"
      >
        <MenuIcon />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
