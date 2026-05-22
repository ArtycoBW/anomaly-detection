import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const INDICATOR_LABELS: Record<string, string> = {
  gdp_per_capita: 'ВРП на душу',
  avg_salary: 'Средняя зарплата',
  investment_per_capita: 'Инвестиции на душу',
  rd_spending_pct_gdp: 'НИОКР (% ВРП)',
  unemployment_rate: 'Безработица',
  poverty_rate: 'Бедность',
  higher_education_share: 'Студенты вузов / 10 тыс.',
  migration_growth: 'Миграция',
  emissions_per_gdp: 'Выбросы на ВРП',
  roads_per_area: 'Плотность дорог',
};

export const INDICATOR_KEYS = Object.keys(INDICATOR_LABELS);

export function getAnomalyColor(score: number): string {
  if (score > 0.65) return 'var(--color-anomaly-red)';
  if (score > 0.4) return 'var(--color-anomaly-yellow)';
  return 'var(--color-anomaly-green)';
}

export function getZScoreColor(z: number): string {
  const abs = Math.abs(z);
  if (abs > 2.5) return z > 0 ? '#dc2626' : '#2563eb';
  if (abs > 1.5) return z > 0 ? '#f87171' : '#60a5fa';
  if (abs > 0.5) return z > 0 ? '#fca5a5' : '#93c5fd';
  return '#e2e8f0';
}
