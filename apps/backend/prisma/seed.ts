import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const regions = [
  { id: 'rostov', name: 'Ростовская область', federalDistrict: 'Южный' },
  { id: 'krasnodar', name: 'Краснодарский край', federalDistrict: 'Южный' },
  { id: 'volgograd', name: 'Волгоградская область', federalDistrict: 'Южный' },
  { id: 'astrakhan', name: 'Астраханская область', federalDistrict: 'Южный' },
  { id: 'kalmykia', name: 'Республика Калмыкия', federalDistrict: 'Южный' },
  { id: 'adygea', name: 'Республика Адыгея', federalDistrict: 'Южный' },
  { id: 'stavropol', name: 'Ставропольский край', federalDistrict: 'Северо-Кавказский' },
  { id: 'dagestan', name: 'Республика Дагестан', federalDistrict: 'Северо-Кавказский' },
];


// Strict-значения из data/indicators.csv: пропуски остаются null.
// ML-пайплайн заполняет gaps только в памяти перед расчётом.
// Происхождение каждой ячейки см. в data/indicators_provenance.csv.
// unemployment_rate — Уровень безработицы МОТ (%)
// avg_salary — Среднемесячная начисленная зарплата (тыс. руб.)
// gdp_per_capita — ВРП на душу населения (тыс. руб.)
// investment_per_capita — Инвестиции в основной капитал на душу (тыс. руб.)
// poverty_rate — Доля населения ниже границы бедности (%)
// higher_education_share — официальный прокси: студенты вузов на 10000 чел. / 100
// rd_spending_pct_gdp — Внутренние затраты на НИОКР / ВРП * 100 (%)
// migration_growth — Миграционный прирост на 10000 чел.
// emissions_per_gdp — Выбросы стац. источников (тыс.тонн) / ВРП (млрд руб.)
// roads_per_area — официальная плотность дорог с твёрдым покрытием (км/1000 км²)

const indicators: Record<string, Record<number, {
  gdpPerCapita: number | null;
  avgSalary: number | null;
  investmentPerCapita: number | null;
  rdSpendingPctGdp: number | null;
  unemploymentRate: number | null;
  povertyRate: number | null;
  higherEducationShare: number | null;
  migrationGrowth: number | null;
  emissionsPerGdp: number | null;
  roadsPerArea: number | null;
}>> = {
  rostov: {
    2020: {
      gdpPerCapita:          406.0,
      avgSalary:             35.6,
      investmentPerCapita:   77.7,
      rdSpendingPctGdp:      0.85,
      unemploymentRate:      5.0,
      povertyRate:           13.0,
      higherEducationShare:  3.1,
      migrationGrowth:       36.0,
      emissionsPerGdp:       0.1,
      roadsPerArea:          267.0,
    },
    2021: {
      gdpPerCapita:          485.9,
      avgSalary:             39.3,
      investmentPerCapita:   93.7,
      rdSpendingPctGdp:      0.7,
      unemploymentRate:      4.0,
      povertyRate:           12.0,
      higherEducationShare:  3.1,
      migrationGrowth:       44.0,
      emissionsPerGdp:       0.09,
      roadsPerArea:          268.7,
    },
    2022: {
      gdpPerCapita:          554.7,
      avgSalary:             44.8,
      investmentPerCapita:   112.6,
      rdSpendingPctGdp:      0.6,
      unemploymentRate:      3.5,
      povertyRate:           10.2,
      higherEducationShare:  3.1,
      migrationGrowth:       -1.0,
      emissionsPerGdp:       0.05,
      roadsPerArea:          270.4,
    },
    2023: {
      gdpPerCapita:          647.6,
      avgSalary:             52.1,
      investmentPerCapita:   155.3,
      rdSpendingPctGdp:      0.67,
      unemploymentRate:      3.1,
      povertyRate:           9.6,
      higherEducationShare:  3.3,
      migrationGrowth:       24.0,
      emissionsPerGdp:       0.05,
      roadsPerArea:          272.8,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             62.5,
      investmentPerCapita:   173.1,
      rdSpendingPctGdp:      null,
      unemploymentRate:      2.4,
      povertyRate:           7.7,
      higherEducationShare:  3.3,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          275.7,
    },
  },
  krasnodar: {
    2020: {
      gdpPerCapita:          459.5,
      avgSalary:             38.5,
      investmentPerCapita:   89.3,
      rdSpendingPctGdp:      0.28,
      unemploymentRate:      5.7,
      povertyRate:           10.6,
      higherEducationShare:  1.8,
      migrationGrowth:       76.0,
      emissionsPerGdp:       0.16,
      roadsPerArea:          486.2,
    },
    2021: {
      gdpPerCapita:          563.4,
      avgSalary:             43.5,
      investmentPerCapita:   95.9,
      rdSpendingPctGdp:      0.32,
      unemploymentRate:      5.0,
      povertyRate:           9.9,
      higherEducationShare:  1.7,
      migrationGrowth:       92.0,
      emissionsPerGdp:       0.13,
      roadsPerArea:          485.1,
    },
    2022: {
      gdpPerCapita:          736.2,
      avgSalary:             50.3,
      investmentPerCapita:   129.3,
      rdSpendingPctGdp:      0.21,
      unemploymentRate:      3.5,
      povertyRate:           9.2,
      higherEducationShare:  1.7,
      migrationGrowth:       20.0,
      emissionsPerGdp:       0.08,
      roadsPerArea:          477.7,
    },
    2023: {
      gdpPerCapita:          819.1,
      avgSalary:             58.3,
      investmentPerCapita:   149.3,
      rdSpendingPctGdp:      0.19,
      unemploymentRate:      2.0,
      povertyRate:           8.7,
      higherEducationShare:  1.8,
      migrationGrowth:       56.0,
      emissionsPerGdp:       0.08,
      roadsPerArea:          481.0,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             70.4,
      investmentPerCapita:   191.8,
      rdSpendingPctGdp:      null,
      unemploymentRate:      2.0,
      povertyRate:           7.0,
      higherEducationShare:  1.8,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          489.3,
    },
  },
  volgograd: {
    2020: {
      gdpPerCapita:          388.0,
      avgSalary:             36.0,
      investmentPerCapita:   72.6,
      rdSpendingPctGdp:      0.4,
      unemploymentRate:      7.6,
      povertyRate:           12.1,
      higherEducationShare:  2.3,
      migrationGrowth:       29.0,
      emissionsPerGdp:       0.18,
      roadsPerArea:          147.5,
    },
    2021: {
      gdpPerCapita:          426.4,
      avgSalary:             39.0,
      investmentPerCapita:   74.4,
      rdSpendingPctGdp:      0.45,
      unemploymentRate:      4.9,
      povertyRate:           11.5,
      higherEducationShare:  2.3,
      migrationGrowth:       25.0,
      emissionsPerGdp:       0.21,
      roadsPerArea:          150.9,
    },
    2022: {
      gdpPerCapita:          486.9,
      avgSalary:             44.2,
      investmentPerCapita:   88.6,
      rdSpendingPctGdp:      0.45,
      unemploymentRate:      3.5,
      povertyRate:           9.4,
      higherEducationShare:  2.3,
      migrationGrowth:       -25.0,
      emissionsPerGdp:       0.18,
      roadsPerArea:          152.5,
    },
    2023: {
      gdpPerCapita:          562.5,
      avgSalary:             51.8,
      investmentPerCapita:   118.4,
      rdSpendingPctGdp:      0.48,
      unemploymentRate:      2.9,
      povertyRate:           9.1,
      higherEducationShare:  2.4,
      migrationGrowth:       -5.0,
      emissionsPerGdp:       0.12,
      roadsPerArea:          153.4,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             61.3,
      investmentPerCapita:   149.2,
      rdSpendingPctGdp:      null,
      unemploymentRate:      2.4,
      povertyRate:           7.5,
      higherEducationShare:  2.5,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          155.4,
    },
  },
  astrakhan: {
    2020: {
      gdpPerCapita:          541.1,
      avgSalary:             38.9,
      investmentPerCapita:   118.1,
      rdSpendingPctGdp:      0.13,
      unemploymentRate:      7.9,
      povertyRate:           15.2,
      higherEducationShare:  3.0,
      migrationGrowth:       -84.0,
      emissionsPerGdp:       0.21,
      roadsPerArea:          83.2,
    },
    2021: {
      gdpPerCapita:          689.0,
      avgSalary:             42.1,
      investmentPerCapita:   119.9,
      rdSpendingPctGdp:      0.12,
      unemploymentRate:      7.7,
      povertyRate:           15.0,
      higherEducationShare:  3.0,
      migrationGrowth:       -59.0,
      emissionsPerGdp:       0.14,
      roadsPerArea:          84.0,
    },
    2022: {
      gdpPerCapita:          800.6,
      avgSalary:             47.8,
      investmentPerCapita:   91.5,
      rdSpendingPctGdp:      0.09,
      unemploymentRate:      7.0,
      povertyRate:           12.5,
      higherEducationShare:  2.9,
      migrationGrowth:       -50.0,
      emissionsPerGdp:       0.14,
      roadsPerArea:          84.0,
    },
    2023: {
      gdpPerCapita:          820.0,
      avgSalary:             54.0,
      investmentPerCapita:   94.2,
      rdSpendingPctGdp:      0.2,
      unemploymentRate:      4.4,
      povertyRate:           12.0,
      higherEducationShare:  3.0,
      migrationGrowth:       -25.0,
      emissionsPerGdp:       0.13,
      roadsPerArea:          84.8,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             62.6,
      investmentPerCapita:   122.3,
      rdSpendingPctGdp:      null,
      unemploymentRate:      2.7,
      povertyRate:           10.6,
      higherEducationShare:  3.0,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          85.0,
    },
  },
  kalmykia: {
    2020: {
      gdpPerCapita:          348.9,
      avgSalary:             32.0,
      investmentPerCapita:   142.0,
      rdSpendingPctGdp:      0.16,
      unemploymentRate:      9.6,
      povertyRate:           22.7,
      higherEducationShare:  3.3,
      migrationGrowth:       -37.0,
      emissionsPerGdp:       0.03,
      roadsPerArea:          51.2,
    },
    2021: {
      gdpPerCapita:          382.5,
      avgSalary:             33.0,
      investmentPerCapita:   66.7,
      rdSpendingPctGdp:      0.13,
      unemploymentRate:      9.0,
      povertyRate:           22.6,
      higherEducationShare:  3.2,
      migrationGrowth:       -56.0,
      emissionsPerGdp:       0.04,
      roadsPerArea:          51.4,
    },
    2022: {
      gdpPerCapita:          451.2,
      avgSalary:             36.3,
      investmentPerCapita:   59.6,
      rdSpendingPctGdp:      0.13,
      unemploymentRate:      8.1,
      povertyRate:           20.6,
      higherEducationShare:  3.3,
      migrationGrowth:       -60.0,
      emissionsPerGdp:       0.03,
      roadsPerArea:          51.6,
    },
    2023: {
      gdpPerCapita:          627.6,
      avgSalary:             42.2,
      investmentPerCapita:   50.2,
      rdSpendingPctGdp:      0.08,
      unemploymentRate:      6.5,
      povertyRate:           17.8,
      higherEducationShare:  3.3,
      migrationGrowth:       91.0,
      emissionsPerGdp:       0.03,
      roadsPerArea:          51.3,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             49.2,
      investmentPerCapita:   86.6,
      rdSpendingPctGdp:      null,
      unemploymentRate:      5.1,
      povertyRate:           13.2,
      higherEducationShare:  3.2,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          52.5,
    },
  },
  adygea: {
    2020: {
      gdpPerCapita:          292.3,
      avgSalary:             32.2,
      investmentPerCapita:   82.7,
      rdSpendingPctGdp:      0.15,
      unemploymentRate:      8.5,
      povertyRate:           13.2,
      higherEducationShare:  2.9,
      migrationGrowth:       94.0,
      emissionsPerGdp:       0.06,
      roadsPerArea:          575.9,
    },
    2021: {
      gdpPerCapita:          346.7,
      avgSalary:             36.0,
      investmentPerCapita:   72.6,
      rdSpendingPctGdp:      0.18,
      unemploymentRate:      8.3,
      povertyRate:           12.2,
      higherEducationShare:  2.8,
      migrationGrowth:       214.0,
      emissionsPerGdp:       0.05,
      roadsPerArea:          576.6,
    },
    2022: {
      gdpPerCapita:          384.6,
      avgSalary:             40.2,
      investmentPerCapita:   93.7,
      rdSpendingPctGdp:      0.16,
      unemploymentRate:      7.1,
      povertyRate:           12.3,
      higherEducationShare:  2.9,
      migrationGrowth:       30.0,
      emissionsPerGdp:       0.09,
      roadsPerArea:          578.6,
    },
    2023: {
      gdpPerCapita:          446.7,
      avgSalary:             46.4,
      investmentPerCapita:   119.0,
      rdSpendingPctGdp:      0.13,
      unemploymentRate:      4.0,
      povertyRate:           11.1,
      higherEducationShare:  3.0,
      migrationGrowth:       71.0,
      emissionsPerGdp:       0.09,
      roadsPerArea:          578.8,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             56.3,
      investmentPerCapita:   137.7,
      rdSpendingPctGdp:      null,
      unemploymentRate:      2.6,
      povertyRate:           8.6,
      higherEducationShare:  3.1,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          576.0,
    },
  },
  stavropol: {
    2020: {
      gdpPerCapita:          291.6,
      avgSalary:             33.9,
      investmentPerCapita:   80.0,
      rdSpendingPctGdp:      0.26,
      unemploymentRate:      6.2,
      povertyRate:           14.3,
      higherEducationShare:  2.3,
      migrationGrowth:       32.0,
      emissionsPerGdp:       0.13,
      roadsPerArea:          275.5,
    },
    2021: {
      gdpPerCapita:          357.5,
      avgSalary:             37.4,
      investmentPerCapita:   87.5,
      rdSpendingPctGdp:      0.26,
      unemploymentRate:      5.3,
      povertyRate:           13.5,
      higherEducationShare:  2.2,
      migrationGrowth:       48.0,
      emissionsPerGdp:       0.12,
      roadsPerArea:          276.5,
    },
    2022: {
      gdpPerCapita:          406.6,
      avgSalary:             41.4,
      investmentPerCapita:   98.9,
      rdSpendingPctGdp:      0.27,
      unemploymentRate:      4.3,
      povertyRate:           11.2,
      higherEducationShare:  2.2,
      migrationGrowth:       -10.0,
      emissionsPerGdp:       0.09,
      roadsPerArea:          277.2,
    },
    2023: {
      gdpPerCapita:          464.2,
      avgSalary:             47.1,
      investmentPerCapita:   119.3,
      rdSpendingPctGdp:      0.31,
      unemploymentRate:      3.8,
      povertyRate:           11.0,
      higherEducationShare:  2.3,
      migrationGrowth:       5.0,
      emissionsPerGdp:       0.07,
      roadsPerArea:          280.7,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             57.2,
      investmentPerCapita:   133.0,
      rdSpendingPctGdp:      null,
      unemploymentRate:      3.4,
      povertyRate:           9.3,
      higherEducationShare:  2.4,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          281.6,
    },
  },
  dagestan: {
    2020: {
      gdpPerCapita:          235.0,
      avgSalary:             31.3,
      investmentPerCapita:   86.7,
      rdSpendingPctGdp:      0.17,
      unemploymentRate:      15.7,
      povertyRate:           14.8,
      higherEducationShare:  1.6,
      migrationGrowth:       -11.0,
      emissionsPerGdp:       0.01,
      roadsPerArea:          420.8,
    },
    2021: {
      gdpPerCapita:          252.7,
      avgSalary:             31.9,
      investmentPerCapita:   81.0,
      rdSpendingPctGdp:      0.16,
      unemploymentRate:      15.1,
      povertyRate:           14.9,
      higherEducationShare:  1.6,
      migrationGrowth:       -6.0,
      emissionsPerGdp:       0.01,
      roadsPerArea:          443.0,
    },
    2022: {
      gdpPerCapita:          274.2,
      avgSalary:             35.1,
      investmentPerCapita:   94.5,
      rdSpendingPctGdp:      0.14,
      unemploymentRate:      12.1,
      povertyRate:           12.7,
      higherEducationShare:  1.7,
      migrationGrowth:       -11.0,
      emissionsPerGdp:       0.01,
      roadsPerArea:          453.0,
    },
    2023: {
      gdpPerCapita:          321.2,
      avgSalary:             39.1,
      investmentPerCapita:   108.9,
      rdSpendingPctGdp:      0.11,
      unemploymentRate:      11.9,
      povertyRate:           12.8,
      higherEducationShare:  1.7,
      migrationGrowth:       -17.0,
      emissionsPerGdp:       0.01,
      roadsPerArea:          477.5,
    },
    2024: {
      gdpPerCapita:          null,
      avgSalary:             44.6,
      investmentPerCapita:   122.8,
      rdSpendingPctGdp:      null,
      unemploymentRate:      11.2,
      povertyRate:           11.7,
      higherEducationShare:  1.7,
      migrationGrowth:       null,
      emissionsPerGdp:       null,
      roadsPerArea:          460.3,
    },
  },
};

async function main() {
  console.log('Upsert регионов...');
  for (const region of regions) {
    await prisma.region.upsert({
      where: { id: region.id },
      create: region,
      update: {
        name: region.name,
        federalDistrict: region.federalDistrict,
      },
    });
    console.log(`  + ${region.name}`);
  }

  console.log('Upsert strict-показателей 2020–2024...');
  for (const [regionId, years] of Object.entries(indicators)) {
    for (const [yearStr, data] of Object.entries(years)) {
      const year = parseInt(yearStr);
      await prisma.indicator.upsert({
        where: {
          regionId_year: { regionId, year },
        },
        create: { regionId, year, ...data },
        update: data,
      });
      console.log(`  + ${regionId} / ${year}`);
    }
  }

  const regionCount = await prisma.region.count();
  const indicatorCount = await prisma.indicator.count();
  console.log(`\nГотово! Загружено: ${regionCount} регионов, ${indicatorCount} записей показателей`);
}

main()
  .catch((e) => {
    console.error('Ошибка seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
