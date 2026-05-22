'use client';

import { useState } from 'react';
import { useYear } from '@/context/YearContext';
import { useVenn } from '@/hooks/useVenn';
import { useProximity } from '@/hooks/useProximity';
import { useComparisonTable } from '@/hooks/useComparisonTable';
import VennDiagram from '@/components/charts/VennDiagram';
import ProximityGraph from '@/components/charts/ProximityGraph';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const ProximityGraph3D = dynamic(
  () => import('@/components/charts/ProximityGraph3D'),
  { ssr: false, loading: () => <div className="h-125 skeleton rounded-xl" /> }
);

function MethodBadge({ isAnomaly }: { isAnomaly: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
        isAnomaly
          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
          : 'bg-slate-700/40 text-slate-500 border border-slate-700/40',
      )}
    >
      {isAnomaly ? '✕ Аномалия' : '✓ Норма'}
    </span>
  );
}

export default function ComparisonPage() {
  const { year } = useYear();
  const { data: vennData, isLoading: loadingVenn } = useVenn(year);
  const { data: proximityData, isLoading: loadingProximity } = useProximity(year);
  const { data: tableData, isLoading: loadingTable } = useComparisonTable(year);
  const [view3D, setView3D] = useState(true);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Сравнение методов</span>
        </h1>
        <p className="text-slate-400 mt-2">
          Пересечение методов детекции и граф близости регионов за {year} год
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loadingVenn ? (
          <ChartSkeleton />
        ) : (
          <Card title="Venn-диаграмма" subtitle="Пересечение методов детекции аномалий">
            {vennData ? (
              <VennDiagram data={vennData} />
            ) : (
              <div className="text-slate-400 py-10 text-center">Нет данных</div>
            )}
          </Card>
        )}

        {loadingProximity ? (
          <ChartSkeleton />
        ) : (
          <Card title="Граф близости" subtitle="Евклидово расстояние в пространстве z-scores">
            <div className="flex items-center gap-1 mb-4 bg-slate-900/80 rounded-lg p-1 w-fit">
              <button
                onClick={() => setView3D(false)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  !view3D
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                2D
              </button>
              <button
                onClick={() => setView3D(true)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  view3D
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                3D
              </button>
            </div>

            {proximityData ? (
              view3D ? (
                <ProximityGraph3D data={proximityData} />
              ) : (
                <ProximityGraph data={proximityData} />
              )
            ) : (
              <div className="text-slate-400 py-10 text-center">Нет данных</div>
            )}
          </Card>
        )}
      </div>

      {/* Таблица сравнения методов — Продвинутый уровень ТЗ */}
      {loadingTable ? (
        <TableSkeleton />
      ) : tableData && tableData.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            title="Таблица сравнения методов"
            subtitle="Регион | Z-score | IF score | D² | χ² p-value | Ensemble — продвинутый уровень ТЗ"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Регион</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Z-score</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">IF score</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">D²</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">χ² p-value</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ensemble</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Стабильность</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData
                    .sort((a: any, b: any) => (b.ensemble_score ?? 0) - (a.ensemble_score ?? 0))
                    .map((row: any, i: number) => (
                      <motion.tr
                        key={row.regionId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {row.ensemble_anomaly && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            )}
                            <span className="text-slate-200 font-medium whitespace-nowrap">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-xs text-slate-300">
                              {row.zscore_score != null ? row.zscore_score.toFixed(3) : '—'}
                            </span>
                            <MethodBadge isAnomaly={row.zscore_anomaly ?? false} />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-xs text-slate-300">
                              {row.if_score != null ? row.if_score.toFixed(4) : '—'}
                            </span>
                            <MethodBadge isAnomaly={row.if_anomaly ?? false} />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-xs text-slate-300">
                            {row.d_squared != null ? row.d_squared.toFixed(2) : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={cn(
                              'font-mono text-xs',
                              row.chi2_p_value != null && row.chi2_p_value < 0.05
                                ? 'text-red-400'
                                : 'text-slate-400',
                            )}
                          >
                            {row.chi2_p_value != null ? row.chi2_p_value.toFixed(4) : '—'}
                            {row.chi2_p_value != null && row.chi2_p_value < 0.05 && (
                              <span className="ml-1 text-[10px] text-red-500">*</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="font-mono font-semibold text-xs px-2 py-0.5 rounded-md"
                              style={{
                                color: row.ensemble_anomaly ? '#f87171' : '#94a3b8',
                                backgroundColor: row.ensemble_anomaly ? '#f8717115' : 'transparent',
                              }}
                            >
                              {row.ensemble_score != null ? row.ensemble_score.toFixed(3) : '—'}
                            </span>
                            <MethodBadge isAnomaly={row.ensemble_anomaly ?? false} />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={
                              row.stability_status === 'stable'
                                ? 'stable'
                                : row.stability_status === 'temporary'
                                  ? 'temporary'
                                  : 'normal'
                            }
                          >
                            {row.stability_status === 'stable'
                              ? 'Устойчивая'
                              : row.stability_status === 'temporary'
                                ? 'Временная'
                                : 'Норма'}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-slate-600">
              * χ² p-value &lt; 0.05 — статистически значимая аномалия по Mahalanobis distance
            </p>
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}
