'use client';

import { useYear } from '@/context/YearContext';
import { useHeatmap } from '@/hooks/useHeatmap';
import AnomalyHeatmap from '@/components/charts/AnomalyHeatmap';
import { Card } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';

export default function HeatmapPage() {
  const { year } = useYear();
  const { data, isLoading, error } = useHeatmap(year);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Тепловая карта Z-scores</span>
        </h1>
        <p className="text-slate-400 mt-2">
          Матрица отклонений 8 регионов x 10 показателей за {year} год
        </p>
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
        <Card>
          <AnomalyHeatmap data={data} />
        </Card>
      ) : null}

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
    </div>
  );
}
