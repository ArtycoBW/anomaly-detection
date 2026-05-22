'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, INDICATOR_LABELS, getZScoreColor } from '@/lib/utils';

interface AnomalyHeatmapProps {
  data: {
    regions: string[];
    indicators: string[];
    matrix: number[][];
  };
}

const Z_SCORE_ANOMALY_THRESHOLD = 2.5;
const Z_SCORE_MODERATE_THRESHOLD = 1.5;

export default function AnomalyHeatmap({ data }: AnomalyHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    rowIdx: number;
    colIdx: number;
    region: string;
    indicator: string;
    value: number;
    rect: { x: number; y: number };
  } | null>(null);

  const { regions, indicators, matrix } = data;

  const getLabel = (key: string): string => INDICATOR_LABELS[key] || key;

  const handleCellEnter = useCallback(
    (e: React.MouseEvent, rowIdx: number, colIdx: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredCell({
        rowIdx,
        colIdx,
        region: regions[rowIdx],
        indicator: getLabel(indicators[colIdx]),
        value: matrix[rowIdx]?.[colIdx] ?? 0,
        rect: { x: rect.left + rect.width / 2, y: rect.top - 8 },
      });
    },
    [regions, indicators, matrix],
  );

  const handleCellLeave = useCallback(() => setHoveredCell(null), []);

  // Find max absolute value for intensity scaling
  const maxAbs = matrix.reduce(
    (max, row) => Math.max(max, ...row.map((v) => Math.abs(v))),
    0,
  );

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto pb-2">
        <table className="border-separate border-spacing-[3px] mx-auto">
          <thead>
            <tr>
              <th className="w-[150px]" />
              {indicators.map((ind) => (
                <th key={ind} className="pb-2 px-0.5">
                  <div className="h-[90px] flex items-end justify-center">
                    <span
                      className="text-[11px] font-medium text-slate-400 whitespace-nowrap origin-bottom-left block"
                      style={{
                        transform: 'rotate(-50deg)',
                        maxWidth: '130px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {getLabel(ind)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regions.map((region, rowIdx) => (
              <motion.tr
                key={region}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIdx * 0.04, duration: 0.3 }}
              >
                {/* Row label */}
                <td className="pr-3 text-right">
                  <span
                    className={cn(
                      'text-[12px] font-medium transition-colors duration-200 whitespace-nowrap',
                      hoveredCell?.rowIdx === rowIdx
                        ? 'text-white'
                        : 'text-slate-400',
                    )}
                  >
                    {region}
                  </span>
                </td>

                {/* Cells */}
                {indicators.map((ind, colIdx) => {
                  const value = matrix[rowIdx]?.[colIdx] ?? 0;
                  const bgColor = getZScoreColor(value);
                  const isHighlighted =
                    hoveredCell?.rowIdx === rowIdx ||
                    hoveredCell?.colIdx === colIdx;
                  const isActive =
                    hoveredCell?.rowIdx === rowIdx &&
                    hoveredCell?.colIdx === colIdx;
                  const absVal = Math.abs(value);
                  const isAnomaly = absVal > Z_SCORE_ANOMALY_THRESHOLD;

                  return (
                    <td key={`${region}-${ind}`} className="p-0">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: rowIdx * 0.03 + colIdx * 0.015,
                          duration: 0.25,
                        }}
                        className={cn(
                          'w-[64px] h-[40px] rounded-lg cursor-pointer relative',
                          'transition-all duration-200 ease-out',
                          'flex items-center justify-center',
                          isActive && 'ring-2 ring-white/60 scale-110 z-20',
                          isHighlighted && !isActive && 'brightness-110',
                          !isHighlighted &&
                            hoveredCell &&
                            'opacity-40',
                        )}
                        style={{
                          backgroundColor: bgColor,
                          boxShadow: isAnomaly
                            ? `0 0 12px ${bgColor}40`
                            : 'none',
                        }}
                        onMouseEnter={(e) =>
                          handleCellEnter(e, rowIdx, colIdx)
                        }
                        onMouseLeave={handleCellLeave}
                      >
                        <span
                          className={cn(
                            'text-[11px] font-mono font-semibold transition-opacity',
                            absVal > Z_SCORE_ANOMALY_THRESHOLD
                              ? 'text-white/90'
                              : absVal > 1
                                ? 'text-slate-900/70'
                                : 'text-slate-700/50',
                          )}
                        >
                          {value.toFixed(1)}
                        </span>
                      </motion.div>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gradient legend bar */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <span className="text-[11px] text-slate-500 font-medium">-3.0</span>
        <div className="flex h-3 rounded-full overflow-hidden w-64 border border-slate-700/50">
          <div className="flex-1" style={{ background: 'linear-gradient(to right, #1d4ed8, #3b82f6, #93c5fd, #e2e8f0, #fca5a5, #f87171, #dc2626)' }} />
        </div>
        <span className="text-[11px] text-slate-500 font-medium">+3.0</span>
        <span className="text-[11px] text-slate-600 ml-2">Z-score</span>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: hoveredCell.rect.x,
              top: hoveredCell.rect.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="px-4 py-3 rounded-xl bg-slate-900/95 border border-slate-600/60 shadow-2xl shadow-black/40 backdrop-blur-sm">
              <div className="text-[13px] font-semibold text-white mb-1.5">
                {hoveredCell.region}
              </div>
              <div className="text-[11px] text-slate-400 mb-2">
                {hoveredCell.indicator}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: getZScoreColor(hoveredCell.value),
                  }}
                />
                <span className="text-[12px] text-slate-300">Z-score:</span>
                <span
                  className="text-[13px] font-mono font-bold"
                  style={{
                    color: getZScoreColor(hoveredCell.value),
                  }}
                >
                  {hoveredCell.value.toFixed(3)}
                </span>
              </div>
              {Math.abs(hoveredCell.value) > Z_SCORE_ANOMALY_THRESHOLD && (
                <div className={`mt-1.5 text-[10px] font-medium ${hoveredCell.value > 0 ? 'text-red-400/90' : 'text-blue-400/90'}`}>
                  {hoveredCell.value > 0 ? 'Регион-лидер (аномально высокий)' : 'Регион-отстающий (аномально низкий)'}
                </div>
              )}
              {Math.abs(hoveredCell.value) > Z_SCORE_MODERATE_THRESHOLD && Math.abs(hoveredCell.value) <= Z_SCORE_ANOMALY_THRESHOLD && (
                <div className="mt-1.5 text-[10px] text-amber-400/80 font-medium">
                  Умеренное отклонение
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
