'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ShapFeature {
  feature: string;
  feature_ru: string;
  value: number;
  impact: string;
}

interface ShapChartProps {
  data: ShapFeature[];
}

export default function ShapChart({ data }: ShapChartProps) {
  const top10 = data.slice(0, 10);

  const chartData = top10.map((item) => ({
    name: item.feature_ru,
    value: item.value,
    impact: item.impact,
    feature: item.feature,
  }));

  const maxAbsValue = Math.max(
    ...chartData.map((d) => Math.abs(d.value)),
    0.01
  );
  const domainPadding = maxAbsValue * 0.15;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={Math.max(300, top10.length * 40 + 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 60, left: 10, bottom: 8 }}
        >
          <XAxis
            type="number"
            domain={[-(maxAbsValue + domainPadding), maxAbsValue + domainPadding]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fill: '#cbd5e1', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="#64748b" strokeWidth={1} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '12px',
            }}
            formatter={(value: number, _name: string, entry: any) => {
              const impact = entry?.payload?.impact;
              const label = impact === 'positive'
                ? 'Увеличивает аномалию'
                : 'Уменьшает аномалию';
              return [`${Number(value).toFixed(4)} (${label})`, 'SHAP'];
            }}
            labelFormatter={(label: string) => `Показатель: ${label}`}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.impact === 'positive' ? '#ef4444' : '#3b82f6'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 mt-2 justify-center">
        <div className="flex items-center gap-2">
          <div className={cn('w-4 h-3 rounded-sm bg-red-500')} />
          <span className="text-xs text-slate-400">Увеличивает аномалию</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('w-4 h-3 rounded-sm bg-blue-500')} />
          <span className="text-xs text-slate-400">Уменьшает аномалию</span>
        </div>
      </div>
    </div>
  );
}
