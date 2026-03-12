// Mock data for testing when backend is not running or returns empty results

const REGIONS = [
  'Республика Адыгея',
  'Астраханская область',
  'Республика Дагестан',
  'Республика Калмыкия',
  'Краснодарский край',
  'Ростовская область',
  'Ставропольский край',
  'Волгоградская область',
];

const INDICATORS = [
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
];

// Realistic z-score matrix (8 regions x 10 indicators)
const HEATMAP_MATRIX: number[][] = [
  [ 0.3, -0.2,  0.1, -0.5,  0.4, -0.1,  0.2,  0.6, -0.3,  0.1],  // Адыгея
  [ 1.7,  0.8,  1.6,  0.3, -0.4,  0.5, -0.2,  1.5,  1.7,  0.4],  // Астрахань
  [-1.3, -1.4, -0.8, -1.1,  2.2,  1.8, -1.9, -0.7, -1.3,  0.2],  // Дагестан
  [-1.8, -1.6, -0.9, -0.4,  1.4,  2.4, -1.9, -0.5,  0.3, -1.2],  // Калмыкия
  [ 1.2,  1.5,  0.9,  0.7, -0.8, -0.6,  0.5,  0.9, -0.2,  1.1],  // Краснодар
  [ 0.8,  0.6,  0.4,  0.9, -0.3, -0.5,  0.7,  0.3,  0.1,  0.6],  // Ростов
  [ 0.1, -0.3,  0.2, -0.2,  0.5,  0.4, -0.1,  0.2, -0.4,  0.3],  // Ставрополь
  [ 0.4,  0.2,  0.3,  0.6, -0.6, -0.3,  0.4,  0.1,  0.2,  0.5],  // Волгоград
];

export const MOCK_HEATMAP = {
  regions: REGIONS,
  indicators: INDICATORS,
  matrix: HEATMAP_MATRIX,
};

// Distance matrix (8x8) for proximity graph
const DISTANCE_MATRIX: number[][] = [
  [0.0, 2.8, 4.5, 3.9, 2.1, 1.8, 1.5, 1.9],
  [2.8, 0.0, 4.1, 3.5, 2.4, 2.6, 3.0, 2.3],
  [4.5, 4.1, 0.0, 2.3, 4.8, 4.2, 3.8, 4.0],
  [3.9, 3.5, 2.3, 0.0, 4.2, 3.7, 3.3, 3.6],
  [2.1, 2.4, 4.8, 4.2, 0.0, 1.4, 2.2, 1.7],
  [1.8, 2.6, 4.2, 3.7, 1.4, 0.0, 1.9, 1.5],
  [1.5, 3.0, 3.8, 3.3, 2.2, 1.9, 0.0, 2.0],
  [1.9, 2.3, 4.0, 3.6, 1.7, 1.5, 2.0, 0.0],
];

export const MOCK_PROXIMITY = {
  regions: REGIONS,
  matrix: DISTANCE_MATRIX,
  anomalyScores: [0.32, 0.74, 0.82, 0.94, 0.28, 0.35, 0.41, 0.30],
};

export const MOCK_VENN = {
  zscore: ['Республика Дагестан', 'Республика Калмыкия', 'Астраханская область', 'Ростовская область', 'Краснодарский край'],
  isolation_forest: ['Республика Калмыкия', 'Краснодарский край', 'Республика Дагестан'],
  mahalanobis: ['Республика Калмыкия', 'Астраханская область', 'Республика Дагестан'],
};

export const MOCK_TIMELINE = [
  {
    regionId: 'adygea',
    regionName: 'Республика Адыгея',
    years: [
      { year: 2022, score: 0.31, isAnomaly: false },
      { year: 2023, score: 0.32, isAnomaly: false },
      { year: 2024, score: 0.28, isAnomaly: false },
    ],
  },
  {
    regionId: 'astrakhan',
    regionName: 'Астраханская область',
    years: [
      { year: 2022, score: 0.68, isAnomaly: true },
      { year: 2023, score: 0.74, isAnomaly: true },
      { year: 2024, score: 0.71, isAnomaly: true },
    ],
  },
  {
    regionId: 'dagestan',
    regionName: 'Республика Дагестан',
    years: [
      { year: 2022, score: 0.78, isAnomaly: true },
      { year: 2023, score: 0.82, isAnomaly: true },
      { year: 2024, score: 0.79, isAnomaly: true },
    ],
  },
  {
    regionId: 'kalmykia',
    regionName: 'Республика Калмыкия',
    years: [
      { year: 2022, score: 0.88, isAnomaly: true },
      { year: 2023, score: 0.94, isAnomaly: true },
      { year: 2024, score: 0.91, isAnomaly: true },
    ],
  },
  {
    regionId: 'krasnodar',
    regionName: 'Краснодарский край',
    years: [
      { year: 2022, score: 0.25, isAnomaly: false },
      { year: 2023, score: 0.28, isAnomaly: false },
      { year: 2024, score: 0.22, isAnomaly: false },
    ],
  },
  {
    regionId: 'rostov',
    regionName: 'Ростовская область',
    years: [
      { year: 2022, score: 0.38, isAnomaly: false },
      { year: 2023, score: 0.35, isAnomaly: false },
      { year: 2024, score: 0.33, isAnomaly: false },
    ],
  },
  {
    regionId: 'stavropol',
    regionName: 'Ставропольский край',
    years: [
      { year: 2022, score: 0.44, isAnomaly: false },
      { year: 2023, score: 0.41, isAnomaly: false },
      { year: 2024, score: 0.39, isAnomaly: false },
    ],
  },
  {
    regionId: 'volgograd',
    regionName: 'Волгоградская область',
    years: [
      { year: 2022, score: 0.29, isAnomaly: false },
      { year: 2023, score: 0.30, isAnomaly: false },
      { year: 2024, score: 0.27, isAnomaly: false },
    ],
  },
];

export const MOCK_ANOMALIES = [
  { regionId: 'adygea', method: 'ensemble', score: 0.32, isAnomaly: false, region: { name: 'Республика Адыгея' } },
  { regionId: 'astrakhan', method: 'ensemble', score: 0.74, isAnomaly: true, region: { name: 'Астраханская область' } },
  { regionId: 'dagestan', method: 'ensemble', score: 0.82, isAnomaly: true, region: { name: 'Республика Дагестан' } },
  { regionId: 'kalmykia', method: 'ensemble', score: 0.94, isAnomaly: true, region: { name: 'Республика Калмыкия' } },
  { regionId: 'krasnodar', method: 'ensemble', score: 0.28, isAnomaly: false, region: { name: 'Краснодарский край' } },
  { regionId: 'rostov', method: 'ensemble', score: 0.35, isAnomaly: false, region: { name: 'Ростовская область' } },
  { regionId: 'stavropol', method: 'ensemble', score: 0.41, isAnomaly: false, region: { name: 'Ставропольский край' } },
  { regionId: 'volgograd', method: 'ensemble', score: 0.30, isAnomaly: false, region: { name: 'Волгоградская область' } },
  // z-score results
  { regionId: 'dagestan', method: 'zscore', score: 0.78, isAnomaly: true, region: { name: 'Республика Дагестан' } },
  { regionId: 'kalmykia', method: 'zscore', score: 0.91, isAnomaly: true, region: { name: 'Республика Калмыкия' } },
  { regionId: 'astrakhan', method: 'zscore', score: 0.69, isAnomaly: true, region: { name: 'Астраханская область' } },
  // iforest results
  { regionId: 'kalmykia', method: 'isolation_forest', score: 0.88, isAnomaly: true, region: { name: 'Республика Калмыкия' } },
  { regionId: 'dagestan', method: 'isolation_forest', score: 0.72, isAnomaly: true, region: { name: 'Республика Дагестан' } },
  // mahalanobis results
  { regionId: 'kalmykia', method: 'mahalanobis', score: 0.85, isAnomaly: true, region: { name: 'Республика Калмыкия' } },
  { regionId: 'astrakhan', method: 'mahalanobis', score: 0.67, isAnomaly: true, region: { name: 'Астраханская область' } },
];

export const MOCK_REPORT_CONTENT = `# Аналитический отчёт по социально-экономическому развитию регионов ЮФО и СКФО за 2023 год

**Дата:** 26 октября 2023 г.
**Автор:** ИИ-аналитик социально-экономического развития

---

## 1. Краткое резюме

Анализ социально-экономического развития **8 субъектов** Южного и Северо-Кавказского федеральных округов за 2023 год выявил **три региона**, демонстрирующих значительные отклонения от средних показателей:

- **Республика Калмыкия** (ensemble score: 0.939)
- **Республика Дагестан** (ensemble score: 0.754)
- **Астраханская область** (ensemble score: 0.735)

## 2. Детальный анализ аномальных регионов

### Республика Калмыкия
> **Ensemble score: 0.939** | Стабильность: Stable

**Проблема:** Калмыкия характеризуется высокой степенью аномальности по трём ключевым показателям:
- Бедность: **+2.38** (значительно выше среднего)
- Высшее образование: **-1.86** (ниже среднего)
- Средняя зарплата: **-1.64** (ниже среднего)

**SHAP-драйверы:** Наиболее значимые факторы — низкий уровень бедности (-0.228), высокий миграционный прирост (-0.140).

### Республика Дагестан
> **Ensemble score: 0.754** | Стабильность: Stable

**Проблема:** Аномально высокий уровень безработицы (**+2.20**), а также низкие показатели ВРП на душу населения (**-1.33**).

**SHAP-драйверы:** Безработица (-0.266), ВРП на душу населения (-0.091).

### Астраханская область
> **Ensemble score: 0.735** | Стабильность: Stable

**Проблема:** Повышенные выбросы на ВРП (**+1.75**), значительный рост инвестиций на душу населения (**+1.66**).

## 3. Сравнение методов

| Метод | Обнаружено аномалий | Регионы |
|-------|-------------------|---------|
| Z-score | 5 | Калмыкия, Дагестан, Астрахань, Ростов, Краснодар |
| Isolation Forest | 2 | Калмыкия, Краснодар |
| Mahalanobis | 2 | Калмыкия, Астрахань |
| **Ensemble** | **3** | **Калмыкия, Дагестан, Астрахань** |

## 4. Рекомендации

1. **Республика Калмыкия** — приоритетное внимание к программам снижения бедности и развития высшего образования
2. **Республика Дагестан** — целевые программы занятости, диверсификация экономики
3. **Астраханская область** — экологический мониторинг промышленных выбросов

---

*Сгенерировано платформой iData Anomaly Detection*
`;
