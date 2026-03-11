import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Названия числовых индикаторов в порядке столбцов матрицы */
const INDICATOR_KEYS = [
  'gdpPerCapita',
  'avgSalary',
  'investmentPerCapita',
  'rdSpendingPctGdp',
  'unemploymentRate',
  'povertyRate',
  'higherEducationShare',
  'migrationGrowth',
  'emissionsPerGdp',
  'roadsPerArea',
] as const;

const INDICATOR_LABELS: Record<string, string> = {
  gdpPerCapita: 'ВРП на душу',
  avgSalary: 'Ср. зарплата',
  investmentPerCapita: 'Инвестиции на душу',
  rdSpendingPctGdp: 'Расходы на НИОКР (% ВРП)',
  unemploymentRate: 'Безработица',
  povertyRate: 'Уровень бедности',
  higherEducationShare: 'Доля высш. образования',
  migrationGrowth: 'Миграционный прирост',
  emissionsPerGdp: 'Выбросы на ед. ВРП',
  roadsPerArea: 'Дороги на ед. площади',
};

type MethodName = 'zscore' | 'isolation_forest' | 'mahalanobis';

@Injectable()
export class AnomaliesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Все аномалии за указанный год.
   */
  async findAll(year?: number) {
    const where = year ? { year } : {};

    return this.prisma.anomalyResult.findMany({
      where,
      include: { region: true },
      orderBy: [{ year: 'desc' }, { regionId: 'asc' }, { method: 'asc' }],
    });
  }

  /**
   * Матрица z-score для тепловой карты.
   * Возвращает { regions, indicators, matrix } где matrix[i][j] — z-score i-го региона по j-му показателю.
   */
  async getHeatmap(year: number) {
    const results = await this.prisma.anomalyResult.findMany({
      where: { year, method: 'zscore' },
      include: { region: true },
      orderBy: { regionId: 'asc' },
    });

    const regions: string[] = [];
    const matrix: number[][] = [];

    for (const result of results) {
      regions.push(result.region.name);
      const zScores = (result.zScores as Record<string, number>) ?? {};
      const row = INDICATOR_KEYS.map((key) => zScores[key] ?? 0);
      matrix.push(row);
    }

    return {
      regions,
      indicators: INDICATOR_KEYS.map((k) => INDICATOR_LABELS[k] ?? k),
      matrix,
    };
  }

  /**
   * Какие регионы отмечены каждым методом (для диаграммы Венна).
   */
  async getVenn(year: number) {
    const results = await this.prisma.anomalyResult.findMany({
      where: {
        year,
        isAnomaly: true,
        method: { in: ['zscore', 'isolation_forest', 'mahalanobis'] },
      },
      include: { region: true },
    });

    const venn: Record<MethodName, string[]> = {
      zscore: [],
      isolation_forest: [],
      mahalanobis: [],
    };

    for (const r of results) {
      const method = r.method as MethodName;
      if (venn[method]) {
        venn[method].push(r.region.name);
      }
    }

    return venn;
  }

  /**
   * Матрица евклидовых расстояний между регионами в пространстве z-score.
   */
  async getProximity(year: number) {
    const results = await this.prisma.anomalyResult.findMany({
      where: { year, method: 'zscore' },
      include: { region: true },
      orderBy: { regionId: 'asc' },
    });

    const regions = results.map((r) => r.region.name);
    const vectors = results.map((r) => {
      const zScores = (r.zScores as Record<string, number>) ?? {};
      return INDICATOR_KEYS.map((key) => zScores[key] ?? 0);
    });

    const n = regions.length;
    const distanceMatrix: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(0),
    );

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let sumSq = 0;
        for (let k = 0; k < vectors[i].length; k++) {
          const diff = vectors[i][k] - vectors[j][k];
          sumSq += diff * diff;
        }
        const dist = Math.round(Math.sqrt(sumSq) * 1000) / 1000;
        distanceMatrix[i][j] = dist;
        distanceMatrix[j][i] = dist;
      }
    }

    return { regions, matrix: distanceMatrix };
  }

  /**
   * Временная шкала: ансамблевые оценки для всех регионов по годам (2022–2024).
   */
  async getTimeline() {
    const results = await this.prisma.anomalyResult.findMany({
      where: { method: 'ensemble' },
      include: { region: true },
      orderBy: [{ regionId: 'asc' }, { year: 'asc' }],
    });

    const grouped = new Map<
      string,
      { regionId: string; regionName: string; years: { year: number; score: number; isAnomaly: boolean }[] }
    >();

    for (const r of results) {
      if (!grouped.has(r.regionId)) {
        grouped.set(r.regionId, {
          regionId: r.regionId,
          regionName: r.region.name,
          years: [],
        });
      }
      grouped.get(r.regionId)!.years.push({
        year: r.year,
        score: r.score,
        isAnomaly: r.isAnomaly,
      });
    }

    return Array.from(grouped.values());
  }
}
