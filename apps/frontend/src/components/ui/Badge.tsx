'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant: 'anomaly' | 'normal' | 'stable' | 'temporary';
  size?: 'sm' | 'md';
}

const variants = {
  anomaly: 'bg-red-500/15 text-red-400 border-red-500/30 shadow-red-500/10',
  normal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
  stable: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10',
  temporary: 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-blue-500/10',
};

const dots = {
  anomaly: 'bg-red-400 animate-pulse',
  normal: 'bg-emerald-400',
  stable: 'bg-amber-400',
  temporary: 'bg-blue-400',
};

export function Badge({ children, variant, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium shadow-sm',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variants[variant],
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dots[variant])} />
      {children}
    </span>
  );
}
