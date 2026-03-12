'use client';

import { useState } from 'react';
import { useYear } from '@/context/YearContext';
import { useHeatmap } from '@/hooks/useHeatmap';
import AnomalyHeatmap from '@/components/charts/AnomalyHeatmap';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Heatmap3D = dynamic(
  () => import('@/components/charts/Heatmap3D'),
  { ssr: false, loading: () => <div className="h-[550px] skeleton rounded-xl" /> }
);

export default function HeatmapPage() {
  const { year } = useYear();
  const { data, isLoading, error } = useHeatmap(year);
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

      {!view3D && (
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#2563eb' }} />
            <span>Сильное отрицательное (z &lt; -2.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#e2e8f0' }} />
            <span>Норма (|z| &lt; 0.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#dc2626' }} />
            <span>Сильное положительное (z &gt; 2.5)</span>
          </div>
        </div>
      )}
    </div>
  );
}
