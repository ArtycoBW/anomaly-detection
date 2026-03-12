'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn, INDICATOR_LABELS, getZScoreColor } from '@/lib/utils';

interface AnomalyHeatmapProps {
  data: {
    regions: string[];
    indicators: string[];
    matrix: number[][];
  };
}

export default function AnomalyHeatmap({ data }: AnomalyHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    region: string;
    indicator: string;
    value: number;
  } | null>(null);

  const { regions, indicators, matrix } = data;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  const getLabel = (key: string): string => {
    return INDICATOR_LABELS[key] || key;
  };

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-[700px]">
          {/* Column headers */}
          <div
            className="flex"
            style={{ paddingLeft: '160px' }}
          >
            {indicators.map((ind) => (
              <div
                key={ind}
                className="w-[72px] h-[80px] flex items-end justify-start"
              >
                <span
                  className="text-xs text-slate-300 whitespace-nowrap origin-bottom-left"
                  style={{
                    transform: 'rotate(-45deg)',
                    display: 'inline-block',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getLabel(ind)}
                </span>
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {regions.map((region, rowIdx) => (
              <div key={region} className="flex items-center">
                {/* Row header */}
                <div className="w-[160px] pr-3 text-right shrink-0">
                  <span className="text-xs text-slate-300 truncate block">
                    {region}
                  </span>
                </div>

                {/* Cells */}
                {indicators.map((ind, colIdx) => {
                  const value = matrix[rowIdx]?.[colIdx] ?? 0;
                  const bgColor = getZScoreColor(value);

                  return (
                    <motion.div
                      key={`${region}-${ind}`}
                      variants={cellVariants}
                      className={cn(
                        'w-[72px] h-[36px] border border-slate-700/50',
                        'cursor-pointer transition-all duration-150',
                        'hover:ring-2 hover:ring-white/40 hover:z-10 relative'
                      )}
                      style={{ backgroundColor: bgColor }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                          region,
                          indicator: getLabel(ind),
                          value,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-900/70">
                        {value.toFixed(1)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pl-[160px]">
            <span className="text-xs text-slate-400">Z-score:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: '#2563eb' }} />
              <span className="text-xs text-slate-400">&lt;-2.5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: '#60a5fa' }} />
              <span className="text-xs text-slate-400">-2.5..-1.5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: '#93c5fd' }} />
              <span className="text-xs text-slate-400">-1.5..-0.5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: '#e2e8f0' }} />
              <span className="text-xs text-slate-400">норма</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: '#fca5a5' }} />
              <span className="text-xs text-slate-400">0.5..1.5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: '#f87171' }} />
              <span className="text-xs text-slate-400">1.5..2.5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-xs text-slate-400">&gt;2.5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-slate-900/95 border border-slate-600 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-xs text-slate-200 space-y-0.5">
            <div>
              <span className="text-slate-400">Регион: </span>
              {tooltip.region}
            </div>
            <div>
              <span className="text-slate-400">Показатель: </span>
              {tooltip.indicator}
            </div>
            <div>
              <span className="text-slate-400">Z-score: </span>
              <span className="font-mono font-semibold">{tooltip.value.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
