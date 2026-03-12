'use client';

import { useTimeline } from '@/hooks/useTimeline';
import AnomalyTimeline from '@/components/charts/AnomalyTimeline';
import { Card } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';

export default function TimelinePage() {
  const { data, isLoading } = useTimeline();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Динамика аномалий</span>
        </h1>
        <p className="text-slate-400 mt-2">
          Изменение ensemble score по годам (2022-2024)
        </p>
      </motion.div>

      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <Card title="Ensemble score по годам" subtitle="Устойчивость аномалий во времени">
          {data ? (
            <AnomalyTimeline data={data} />
          ) : (
            <div className="text-slate-400 py-10 text-center">Нет данных</div>
          )}
        </Card>
      )}
    </div>
  );
}
