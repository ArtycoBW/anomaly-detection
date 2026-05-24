'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ComposedChart,
} from 'recharts';
import { cn } from '@/lib/utils';

interface TimelineYear {
  year: number;
  score: number;
  isAnomaly: boolean;
}

interface TimelineRegion {
  regionId: string;
  regionName: string;
  years: TimelineYear[];
}

interface AnomalyTimelineProps {
  data: TimelineRegion[];
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#a855f7', '#84cc16', '#e11d48',
];

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: Record<string, unknown>;
  dataKey?: string;
  stroke?: string;
  regionData?: TimelineRegion;
}

function AnomalyDot({ cx, cy, payload, regionData, stroke }: CustomDotProps) {
  if (cx == null || cy == null || !payload || !regionData) return null;

  const year = payload.year as number;
  const yearEntry = regionData.years.find((y) => y.year === year);

  if (yearEntry?.isAnomaly) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#ef4444" opacity={0.3} />
        <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fca5a5" strokeWidth={2} />
      </g>
    );
  }

  return (
    <circle cx={cx} cy={cy} r={4} fill={stroke} stroke={stroke} strokeWidth={1} />
  );
}

export default function AnomalyTimeline({ data }: AnomalyTimelineProps) {
  const years = useMemo(() => {
    const allYears = new Set<number>();
    data.forEach((region) => {
      region.years.forEach((y) => allYears.add(y.year));
    });
    return Array.from(allYears).sort((a, b) => a - b);
  }, [data]);

  const chartData = useMemo(() => {
    return years.map((year) => {
      const point: Record<string, unknown> = { year };
      data.forEach((region) => {
        const yearData = region.years.find((y) => y.year === year);
        point[region.regionId] = yearData?.score ?? null;
      });
      return point;
    });
  }, [data, years]);

  return (
    <div className="w-full">
      <div
        className={cn(
          'w-full rounded-lg p-4',
          'bg-slate-900/60 border border-slate-700/50'
        )}
      >
        <ResponsiveContainer width="100%" height={450}>
          <LineChart
            data={chartData}
            margin={{ top: 16, right: 30, left: 16, bottom: 16 }}
          >
            <XAxis
              dataKey="year"
              tick={{ fill: '#e2e8f0', fontSize: 13 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
              tickFormatter={(v) => String(v)}
              type="number"
              domain={['dataMin', 'dataMax']}
              allowDecimals={false}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
              label={{
                value: 'Оценка аномалии',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 12,
                offset: -4,
              }}
            />
            <ReferenceLine
              y={0.65}
              stroke="#ef4444"
              strokeDasharray="8 4"
              strokeWidth={1.5}
              label={{
                value: 'Порог аномалии (0.65)',
                fill: '#ef4444',
                fontSize: 11,
                position: 'right',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px',
              }}
              labelFormatter={(label) => `Год: ${label}`}
              formatter={(value: number, name: string) => {
                const region = data.find((r) => r.regionId === name);
                const displayName = region?.regionName ?? name;
                return [value?.toFixed(3), displayName];
              }}
            />
            <Legend
              formatter={(value) => {
                const region = data.find((r) => r.regionId === value);
                return region?.regionName ?? value;
              }}
              wrapperStyle={{ color: '#e2e8f0', fontSize: 12, paddingTop: 8 }}
            />
            {data.map((region, i) => (
              <Line
                key={region.regionId}
                type="monotone"
                dataKey={region.regionId}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={(props: CustomDotProps & { key?: React.Key }) => {
                  const { key: _key, ...dotProps } = props;
                  return (
                  <AnomalyDot
                    key={`${props.cx}-${props.cy}`}
                    {...dotProps}
                    regionData={region}
                    stroke={COLORS[i % COLORS.length]}
                  />
                  );
                }}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-3 justify-center text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-300/40" />
          <span>Аномалия</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 border-t-2 border-dashed border-red-500" />
          <span>Порог (0.65)</span>
        </div>
      </div>
    </div>
  );
}
