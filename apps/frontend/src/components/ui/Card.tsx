'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  glow?: boolean;
  noPadding?: boolean;
}

export function Card({ children, title, subtitle, className, glow, noPadding }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-slate-900/60 backdrop-blur-xl',
        'border border-slate-700/40',
        'shadow-lg shadow-black/20',
        'transition-all duration-300',
        'hover:border-slate-600/60 hover:shadow-xl hover:shadow-indigo-500/5',
        glow && 'anomaly-glow',
        className,
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />

      <div className={cn('relative', !noPadding && 'p-6')}>
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
