import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Ключи индикаторов в snake_case (как хранит ML сервис) */
const INDICATOR_KEYS = [
  'gdp_per_capita',
  'avg_salary',
  'investment_per_capita',
  'rd_spending_pct_gdp',
  'unemployment_rate',
  'poverty_rate',
  'higher_education_share',
  'migration_growth',
  'emissions_per_gdp',
  'roads_per_area',
] as const;

const INDICATOR_LABELS: Record<string, string> = {
  gdp_per_capita: 'ВРП на душу населения',
  avg_salary: 'Средняя зарплата',
  investment_per_capita: 'Инвестиции на душу',
  rd_spending_pct_gdp: 'Расходы на НИОКР (% ВРП)',
  unemployment_rate: 'Безработица',
  poverty_rate: 'Уровень бедности',
  higher_education_share: 'Студенты вузов / 10 тыс.',
  migration_growth: 'Миграционный прирост',
  emissions_per_gdp: 'Выбросы на ед. ВРП',
  roads_per_area: 'Плотность дорог',
};

type MethodName = 'zscore' | 'isolation_forest' | 'mahalanobis';
const Z_SCORE_ANOMALY_THRESHOLD = 2.5;

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
    const [results, ensembleResults] = await Promise.all([
      this.prisma.anomalyResult.findMany({
        where: { year, method: 'zscore' },
        include: { region: true },
        orderBy: { regionId: 'asc' },
      }),
      this.prisma.anomalyResult.findMany({
        where: { year, method: 'ensemble' },
        select: { regionId: true, score: true },
      }),
    ]);
    const ensembleScoreByRegion = new Map(
      ensembleResults.map((r) => [r.regionId, r.score]),
    );

    const regions = results.map((r) => r.region.name);
    const anomalyScores = results.map((r) => ensembleScoreByRegion.get(r.regionId) ?? 0);
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

    return { regions, matrix: distanceMatrix, anomalyScores };
  }

  /**
   * Сводная таблица: Регион | IF_score | D² | χ² p-value | Статус по каждому методу.
   */
  async getComparisonTable(year: number) {
    const results = await this.prisma.anomalyResult.findMany({
      where: { year },
      include: { region: true },
      orderBy: [{ regionId: 'asc' }, { method: 'asc' }],
    });

    const regionMap = new Map<string, any>();
    for (const r of results) {
      if (!regionMap.has(r.regionId)) {
        regionMap.set(r.regionId, { regionId: r.regionId, name: r.region.name });
      }
      const entry = regionMap.get(r.regionId)!;
      const zScoresJson = r.zScores as Record<string, number> | null;

      if (r.method === 'zscore') {
        entry.zscore_score = r.score;
        entry.zscore_anomaly = r.isAnomaly;
      } else if (r.method === 'isolation_forest') {
        entry.if_score = r.score;
        entry.if_anomaly = r.isAnomaly;
      } else if (r.method === 'mahalanobis') {
        entry.maha_score = r.score;
        entry.maha_anomaly = r.isAnomaly;
        entry.d_squared = zScoresJson?.d_squared ?? null;
        entry.chi2_p_value = zScoresJson?.chi2_p_value ?? null;
      } else if (r.method === 'ensemble') {
        entry.ensemble_score = r.score;
        entry.ensemble_anomaly = r.isAnomaly;
        entry.stability_status = r.stabilityStatus;
      }
    }

    return Array.from(regionMap.values());
  }

  /**
   * Таблица аномалий по показателям (Базовый уровень ТЗ):
   * Регион | Показатель | z-score | Тип (лидер/отстающий)
   * Только записи с |z| > 2.5.
   */
  async getIndicatorTable(year: number) {
    const results = await this.prisma.anomalyResult.findMany({
      where: { year, method: 'zscore' },
      include: { region: true },
      orderBy: { regionId: 'asc' },
    });

    const rows: {
      regionId: string;
      regionName: string;
      indicator: string;
      indicatorRu: string;
      zScore: number;
      type: 'лидер' | 'отстающий';
    }[] = [];

    for (const result of results) {
      const zScores = (result.zScores as Record<string, number>) ?? {};
      for (const key of INDICATOR_KEYS) {
        const z = zScores[key] ?? 0;
        if (Math.abs(z) > Z_SCORE_ANOMALY_THRESHOLD) {
          rows.push({
            regionId: result.regionId,
            regionName: result.region.name,
            indicator: key,
            indicatorRu: INDICATOR_LABELS[key] ?? key,
            zScore: Math.round(z * 1000) / 1000,
            type: z > 0 ? 'лидер' : 'отстающий',
          });
        }
      }
    }

    return rows.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
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
