'use client';

import { use } from 'react';
import { useYear } from '@/context/YearContext';
import { useRegionDetail } from '@/hooks/useRegionDetail';
import ShapChart from '@/components/charts/ShapChart';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { INDICATOR_LABELS, getAnomalyColor } from '@/lib/utils';
import Link from 'next/link';

export default function RegionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { year } = useYear();
  const { data: region, isLoading } = useRegionDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!region) {
    return <div className="text-slate-400">Регион не найден</div>;
  }

  const anomalies = region.anomalies?.filter((a: any) => a.year === year) ?? [];
  const ensemble = anomalies.find((a: any) => a.method === 'ensemble');
  const shapValues = ensemble?.shapValues;
  const zScores = ensemble?.zScores;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-slate-300">
          ← Назад
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{region.name}</h1>
        <p className="text-slate-400 mt-1">{region.federalDistrict}</p>
      </div>

      {/* Карточки методов */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['zscore', 'isolation_forest', 'mahalanobis', 'ensemble'].map((method) => {
          const result = anomalies.find((a: any) => a.method === method);
          if (!result) return null;
          const methodNames: Record<string, string> = {
            zscore: 'Z-Score',
            isolation_forest: 'Isolation Forest',
            mahalanobis: 'Mahalanobis',
            ensemble: 'Ensemble',
          };
          return (
            <Card key={method}>
              <div className="text-sm text-slate-400">{methodNames[method]}</div>
              <div
                className="text-2xl font-bold font-mono mt-1"
                style={{ color: getAnomalyColor(result.score) }}
              >
                {result.score.toFixed(3)}
              </div>
              <Badge variant={result.isAnomaly ? 'anomaly' : 'normal'}>
                {result.isAnomaly ? 'Аномалия' : 'Норма'}
              </Badge>
            </Card>
          );
        })}
      </div>

      {/* SHAP */}
      {shapValues && (
        <Card title="SHAP — вклад показателей" subtitle="Какие факторы влияют на аномальность региона">
          <ShapChart data={shapValues} />
        </Card>
      )}

      {/* Z-scores таблица */}
      {zScores && (
        <Card title="Z-scores по показателям" subtitle="Отклонение от среднего по всем регионам">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(zScores).map(([key, value]: [string, any]) => (
              <div
                key={key}
                className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50"
              >
                <div className="text-xs text-slate-400">
                  {INDICATOR_LABELS[key] || key}
                </div>
                <div
                  className="text-lg font-mono font-bold mt-1"
                  style={{
                    color:
                      Math.abs(value) > 1.5
                        ? value > 0
                          ? '#ef4444'
                          : '#3b82f6'
                        : '#94a3b8',
                  }}
                >
                  {value > 0 ? '+' : ''}
                  {value.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Показатели по годам */}
      {region.indicators && region.indicators.length > 0 && (
        <Card title="Показатели по годам" subtitle="Динамика социально-экономических показателей">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left py-2 px-3">Показатель</th>
                  {[2022, 2023, 2024].map((y) => (
                    <th key={y} className="text-right py-2 px-3">
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(INDICATOR_LABELS).map(([key, label]) => (
                  <tr key={key} className="border-b border-slate-700/30">
                    <td className="py-2 px-3 text-slate-300">{label}</td>
                    {[2022, 2023, 2024].map((y) => {
                      const indicator = region.indicators.find(
                        (ind: any) => ind.year === y,
                      );
                      const camelKey = key.replace(/_([a-z])/g, (_, c: string) =>
                        c.toUpperCase(),
                      );
                      const val = indicator?.[camelKey];
                      return (
                        <td key={y} className="py-2 px-3 text-right font-mono">
                          {val != null ? val.toFixed(1) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
