'use client';

import { useState } from 'react';
import { useYear } from '@/context/YearContext';
import { useVenn } from '@/hooks/useVenn';
import { useProximity } from '@/hooks/useProximity';
import VennDiagram from '@/components/charts/VennDiagram';
import ProximityGraph from '@/components/charts/ProximityGraph';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const ProximityGraph3D = dynamic(
  () => import('@/components/charts/ProximityGraph3D'),
  { ssr: false, loading: () => <div className="h-[500px] skeleton rounded-xl" /> }
);

export default function ComparisonPage() {
  const { year } = useYear();
  const { data: vennData, isLoading: loadingVenn } = useVenn(year);
  const { data: proximityData, isLoading: loadingProximity } = useProximity(year);
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
            {/* Toggle 2D/3D */}
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
    </div>
  );
}
