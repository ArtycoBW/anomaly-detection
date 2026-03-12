'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VennDiagramProps {
  data: {
    zscore: string[];
    isolation_forest: string[];
    mahalanobis: string[];
  };
}

interface VennSections {
  zscoreOnly: string[];
  iforestOnly: string[];
  mahalanobisOnly: string[];
  zscore_iforest: string[];
  zscore_mahalanobis: string[];
  iforest_mahalanobis: string[];
  allThree: string[];
}

export default function VennDiagram({ data }: VennDiagramProps) {
  const sections = useMemo<VennSections>(() => {
    const zSet = new Set(data.zscore);
    const iSet = new Set(data.isolation_forest);
    const mSet = new Set(data.mahalanobis);

    const allRegions = new Set([...zSet, ...iSet, ...mSet]);

    const allThree: string[] = [];
    const zscore_iforest: string[] = [];
    const zscore_mahalanobis: string[] = [];
    const iforest_mahalanobis: string[] = [];
    const zscoreOnly: string[] = [];
    const iforestOnly: string[] = [];
    const mahalanobisOnly: string[] = [];

    for (const r of allRegions) {
      const inZ = zSet.has(r);
      const inI = iSet.has(r);
      const inM = mSet.has(r);

      if (inZ && inI && inM) allThree.push(r);
      else if (inZ && inI) zscore_iforest.push(r);
      else if (inZ && inM) zscore_mahalanobis.push(r);
      else if (inI && inM) iforest_mahalanobis.push(r);
      else if (inZ) zscoreOnly.push(r);
      else if (inI) iforestOnly.push(r);
      else if (inM) mahalanobisOnly.push(r);
    }

    return {
      zscoreOnly,
      iforestOnly,
      mahalanobisOnly,
      zscore_iforest,
      zscore_mahalanobis,
      iforest_mahalanobis,
      allThree,
    };
  }, [data]);

  const width = 520;
  const height = 440;
  const cx1 = 200, cy1 = 190, r = 130; // Z-score (left)
  const cx2 = 320, cy2 = 190;           // Isolation Forest (right)
  const cx3 = 260, cy3 = 290;           // Mahalanobis (bottom)

  const renderNames = (names: string[], x: number, y: number, bold = false) => {
    if (names.length === 0) return null;
    return names.map((name, i) => (
      <text
        key={name}
        x={x}
        y={y + i * 14}
        textAnchor="middle"
        className={cn(
          'fill-slate-200 text-[10px]',
          bold && 'font-bold text-[11px] fill-white'
        )}
      >
        {name}
      </text>
    ));
  };

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[520px]"
        role="img"
        aria-label="Диаграмма Венна методов обнаружения аномалий"
      >
        {/* Circle: Z-score */}
        <circle
          cx={cx1} cy={cy1} r={r}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth={2}
        />
        {/* Circle: Isolation Forest */}
        <circle
          cx={cx2} cy={cy2} r={r}
          fill="rgba(34, 197, 94, 0.2)"
          stroke="#22c55e"
          strokeWidth={2}
        />
        {/* Circle: Mahalanobis */}
        <circle
          cx={cx3} cy={cy3} r={r}
          fill="rgba(239, 68, 68, 0.2)"
          stroke="#ef4444"
          strokeWidth={2}
        />

        {/* Circle labels */}
        <text x={cx1 - 70} y={cy1 - 100} textAnchor="middle" className="fill-blue-400 text-xs font-semibold">
          Z-score
        </text>
        <text x={cx2 + 70} y={cy2 - 100} textAnchor="middle" className="fill-green-400 text-xs font-semibold">
          Isolation Forest
        </text>
        <text x={cx3} y={cy3 + r + 20} textAnchor="middle" className="fill-red-400 text-xs font-semibold">
          Mahalanobis
        </text>

        {/* Z-score only (far left) */}
        {renderNames(sections.zscoreOnly, 150, 180)}

        {/* Isolation Forest only (far right) */}
        {renderNames(sections.iforestOnly, 370, 180)}

        {/* Mahalanobis only (bottom) */}
        {renderNames(sections.mahalanobisOnly, 260, 340)}

        {/* Z-score & Isolation Forest overlap (top center) */}
        {renderNames(sections.zscore_iforest, 260, 150)}

        {/* Z-score & Mahalanobis overlap (bottom left) */}
        {renderNames(sections.zscore_mahalanobis, 200, 270)}

        {/* Isolation Forest & Mahalanobis overlap (bottom right) */}
        {renderNames(sections.iforest_mahalanobis, 320, 270)}

        {/* All three (center) */}
        {renderNames(sections.allThree, 260, 220, true)}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500/60 border-2 border-blue-500" />
          <span className="text-sm text-slate-300">Z-score ({data.zscore.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500/60 border-2 border-green-500" />
          <span className="text-sm text-slate-300">Isolation Forest ({data.isolation_forest.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500/60 border-2 border-red-500" />
          <span className="text-sm text-slate-300">Mahalanobis ({data.mahalanobis.length})</span>
        </div>
      </div>

      {/* Summary */}
      {sections.allThree.length > 0 && (
        <div className="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <span className="text-sm text-red-300">
            Все три метода: <strong>{sections.allThree.join(', ')}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
