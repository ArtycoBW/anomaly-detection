'use client';

import { useEffect, useRef, useState } from 'react';
import { useYear } from '@/context/YearContext';
import { useAnomalies } from '@/hooks/useAnomalies';
import { useRegions } from '@/hooks/useRegions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { getAnomalyColor } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const duration = 800;
    const startTime = performance.now();

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="font-mono tabular-nums">
      {Number.isInteger(value) ? Math.round(display) : display.toFixed(1)}
      {suffix}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  icon: React.ReactNode;
  delay?: number;
}

function StatCard({ label, value, suffix, color, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 p-6 group hover:border-slate-600/60 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color ?? 'text-slate-100'}`}>
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const { year } = useYear();
  const { data: anomalies, isLoading: loadingAnomalies } = useAnomalies(year);
  const { data: regions, isLoading: loadingRegions } = useRegions();

  const isLoading = loadingAnomalies || loadingRegions;

  // Group flat anomaly array by regionId
  const anomalyList = anomalies ?? [];
  const regionMap = new Map<string, any>();
  anomalyList.forEach((item: any) => {
    if (!regionMap.has(item.regionId)) {
      regionMap.set(item.regionId, {
        region_id: item.regionId,
        name: item.region?.name ?? item.regionId,
        federal_district: item.region?.federalDistrict ?? '',
        methods: {},
      });
    }
    const region = regionMap.get(item.regionId)!;
    region.methods[item.method] = {
      score: item.score,
      is_anomaly: item.isAnomaly,
      stability_status: item.stabilityStatus,
    };
  });
  const regionsList = Array.from(regionMap.values());
  const anomalyCount = regionsList.filter((r: any) => r.methods?.ensemble?.is_anomaly).length;

  // Sort: anomalies first, then by score desc
  regionsList.sort((a: any, b: any) => {
    const aAnomaly = a.methods?.ensemble?.is_anomaly ? 1 : 0;
    const bAnomaly = b.methods?.ensemble?.is_anomaly ? 1 : 0;
    if (aAnomaly !== bAnomaly) return bAnomaly - aAnomaly;
    return (b.methods?.ensemble?.score ?? 0) - (a.methods?.ensemble?.score ?? 0);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Обзор аномалий</span>
        </h1>
        <p className="text-slate-400 mt-2">
          Анализ социально-экономических показателей регионов ЮФО и СКФО за {year} год
        </p>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Регионов"
            value={regions?.length ?? 0}
            delay={0}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="currentColor" strokeWidth="1.5"/></svg>}
          />
          <StatCard
            label="Аномалий"
            value={anomalyCount}
            color="text-red-400"
            delay={0.1}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L18 17H2L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 9V12M10 14.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Показателей"
            value={10}
            delay={0.2}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3V17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 13V10M10 13V7M13 13V9M16 13V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Методов детекции"
            value={3}
            delay={0.3}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/></svg>}
          />
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card title="Регионы" subtitle="Ensemble score и статус аномалии">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Регион</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Фед. округ</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ensemble Score</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Стабильность</th>
                </tr>
              </thead>
              <tbody>
                {regionsList.map((region: any, i: number) => {
                  const ensemble = region.methods?.ensemble;
                  const score = ensemble?.score ?? 0;
                  const isAnomaly = ensemble?.is_anomaly ?? false;
                  const stability = ensemble?.stability_status ?? 'normal';

                  return (
                    <motion.tr
                      key={region.region_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="border-b border-slate-800/50 row-glow transition-all duration-200 group"
                    >
                      <td className="py-4 px-4">
                        <Link
                          href={`/regions/${region.region_id}`}
                          className="text-slate-200 hover:text-indigo-400 font-medium transition-colors flex items-center gap-2"
                        >
                          {isAnomaly && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                          {region.name}
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {region.federal_district}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className="font-mono text-sm font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            color: getAnomalyColor(score),
                            backgroundColor: `${getAnomalyColor(score)}10`,
                          }}
                        >
                          {score.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={isAnomaly ? 'anomaly' : 'normal'}>
                          {isAnomaly ? 'Аномалия' : 'Норма'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={stability === 'stable' ? 'stable' : stability === 'temporary' ? 'temporary' : 'normal'}>
                          {stability === 'stable' ? 'Устойчивая' : stability === 'temporary' ? 'Временная' : 'Норма'}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
