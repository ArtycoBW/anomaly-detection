'use client';

import { useYear } from '@/context/YearContext';
import { useVenn } from '@/hooks/useVenn';
import { useProximity } from '@/hooks/useProximity';
import VennDiagram from '@/components/charts/VennDiagram';
import ProximityGraph from '@/components/charts/ProximityGraph';
import { Card } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'framer-motion';

export default function ComparisonPage() {
  const { year } = useYear();
  const { data: vennData, isLoading: loadingVenn } = useVenn(year);
  const { data: proximityData, isLoading: loadingProximity } = useProximity(year);

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
            {proximityData ? (
              <ProximityGraph data={proximityData} />
            ) : (
              <div className="text-slate-400 py-10 text-center">Нет данных</div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
