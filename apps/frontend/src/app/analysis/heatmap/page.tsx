'use client';

import { useState } from 'react';
import { useYear } from '@/context/YearContext';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useIndicatorTable } from '@/hooks/useIndicatorTable';
import AnomalyHeatmap from '@/components/charts/AnomalyHeatmap';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Heatmap3D = dynamic(
  () => import('@/components/charts/Heatmap3D'),
  { ssr: false, loading: () => <div className="h-[550px] skeleton rounded-xl" /> }
);

export default function HeatmapPage() {
  const { year } = useYear();
  const { data, isLoading, error } = useHeatmap(year);
  const { data: indicatorRows, isLoading: loadingTable } = useIndicatorTable(year);
  const [view3D, setView3D] = useState(true);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Тепловая карта Z-scores</span>
          </h1>
          <p className="text-slate-400 mt-2">
            Матрица отклонений 8 регионов x 10 показателей за {year} год
          </p>
        </div>

        {/* Toggle 2D/3D */}
        <div className="flex items-center gap-1 bg-slate-900/80 rounded-lg p-1">
          <button
            onClick={() => setView3D(false)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              !view3D
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            2D Таблица
          </button>
          <button
            onClick={() => setView3D(true)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              view3D
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            3D Визуализация
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <ChartSkeleton />
      ) : error ? (
        <Card>
          <div className="text-red-400 py-10 text-center">
            Ошибка загрузки данных. Убедитесь, что ML пайплайн запущен.
          </div>
        </Card>
      ) : data ? (
        view3D ? (
          <Card noPadding>
            <div className="p-4">
              <Heatmap3D data={data} />
            </div>
          </Card>
        ) : (
          <Card>
            <AnomalyHeatmap data={data} />
          </Card>
        )
      ) : null}

      {/* Таблица аномалий по показателям — Базовый уровень ТЗ */}
      {loadingTable ? (
        <TableSkeleton />
      ) : indicatorRows ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            title="Таблица аномалий по показателям"
            subtitle={`Регионы с |z-score| > 2.5 — базовый уровень ТЗ (${year} г.)`}
          >
            {indicatorRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Регион</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Показатель</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Z-score</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Тип</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicatorRows.map((row: any, i: number) => (
                      <motion.tr
                        key={`${row.regionId}-${row.indicator}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-200 font-medium">{row.regionName}</td>
                        <td className="py-3 px-4 text-slate-400">{row.indicatorRu}</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className="font-mono font-semibold px-2 py-0.5 rounded-md text-sm"
                            style={{
                              color: row.zScore > 0 ? '#f87171' : '#60a5fa',
                              backgroundColor: row.zScore > 0 ? '#f8717115' : '#60a5fa15',
                            }}
                          >
                            {row.zScore > 0 ? '+' : ''}{row.zScore.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={row.type === 'лидер' ? 'anomaly' : 'temporary'}>
                            {row.type === 'лидер' ? 'Лидер ↑' : 'Отстающий ↓'}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Нет показателей с |z| &gt; 2.5 за {year} год по строгому порогу ТЗ.
              </p>
            )}
          </Card>
        </motion.div>
      ) : null}

      {!view3D && (
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#1d4ed8' }} />
            <span>Отстающий: регион-аутсайдер (z &lt; -2.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#e2e8f0' }} />
            <span>Норма (|z| &lt; 1.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#dc2626' }} />
            <span>Лидер: регион опережает (z &gt; 2.5)</span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4 text-xs text-slate-500">
            <span>Порог аномалии |z| &gt; 2.5</span>
          </div>
        </div>
      )}
    </div>
  );
}
