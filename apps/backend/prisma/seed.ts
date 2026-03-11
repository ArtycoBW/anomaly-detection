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

// Данные Росстата: социально-экономические показатели регионов ЮФО/СКФО
// Источники: rosstat.gov.ru, Единая межведомственная информационно-статистическая система (ЕМИСС)
// gdpPerCapita — ВРП на душу населения (тыс. руб.)
// avgSalary — Среднемесячная номинальная зарплата (тыс. руб.)
// investmentPerCapita — Инвестиции в основной капитал на душу (тыс. руб.)
// rdSpendingPctGdp — Расходы на НИОКР в % от ВРП
// unemploymentRate — Уровень безработицы по МОТ (%)
// povertyRate — Доля населения с доходами ниже прожиточного минимума (%)
// higherEducationShare — Доля занятых с высшим образованием (%)
// migrationGrowth — Миграционный прирост на 10 тыс. населения
// emissionsPerGdp — Выбросы загрязняющих веществ на 1 млн руб. ВРП (тонн)
// roadsPerArea — Плотность дорог с твёрдым покрытием на 1000 км² (км)

const indicators: Record<string, Record<number, {
  gdpPerCapita: number;
  avgSalary: number;
  investmentPerCapita: number;
  rdSpendingPctGdp: number;
  unemploymentRate: number;
  povertyRate: number;
  higherEducationShare: number;
  migrationGrowth: number;
  emissionsPerGdp: number;
  roadsPerArea: number;
}>> = {
  rostov: {
    2022: {
      gdpPerCapita: 478.2,
      avgSalary: 40.5,
      investmentPerCapita: 98.3,
      rdSpendingPctGdp: 1.1,
      unemploymentRate: 4.8,
      povertyRate: 13.1,
      higherEducationShare: 33.2,
      migrationGrowth: 18.5,
      emissionsPerGdp: 2.8,
      roadsPerArea: 232.0,
    },
    2023: {
      gdpPerCapita: 521.6,
      avgSalary: 45.8,
      investmentPerCapita: 112.7,
      rdSpendingPctGdp: 1.2,
      unemploymentRate: 3.9,
      povertyRate: 12.4,
      higherEducationShare: 34.1,
      migrationGrowth: 15.2,
      emissionsPerGdp: 2.6,
      roadsPerArea: 235.0,
    },
    2024: {
      gdpPerCapita: 568.4,
      avgSalary: 51.2,
      investmentPerCapita: 125.4,
      rdSpendingPctGdp: 1.3,
      unemploymentRate: 3.5,
      povertyRate: 11.8,
      higherEducationShare: 34.8,
      migrationGrowth: 12.8,
      emissionsPerGdp: 2.5,
      roadsPerArea: 238.0,
    },
  },
  krasnodar: {
    2022: {
      gdpPerCapita: 542.8,
      avgSalary: 42.1,
      investmentPerCapita: 132.5,
      rdSpendingPctGdp: 0.4,
      unemploymentRate: 4.2,
      povertyRate: 11.6,
      higherEducationShare: 31.5,
      migrationGrowth: 62.3,
      emissionsPerGdp: 1.9,
      roadsPerArea: 310.0,
    },
    2023: {
      gdpPerCapita: 598.1,
      avgSalary: 47.6,
      investmentPerCapita: 148.9,
      rdSpendingPctGdp: 0.4,
      unemploymentRate: 3.5,
      povertyRate: 10.8,
      higherEducationShare: 32.3,
      migrationGrowth: 55.1,
      emissionsPerGdp: 1.8,
      roadsPerArea: 315.0,
    },
    2024: {
      gdpPerCapita: 648.3,
      avgSalary: 53.4,
      investmentPerCapita: 162.1,
      rdSpendingPctGdp: 0.5,
      unemploymentRate: 3.1,
      povertyRate: 10.2,
      higherEducationShare: 33.0,
      migrationGrowth: 48.7,
      emissionsPerGdp: 1.7,
      roadsPerArea: 320.0,
    },
  },
  volgograd: {
    2022: {
      gdpPerCapita: 412.5,
      avgSalary: 37.8,
      investmentPerCapita: 78.4,
      rdSpendingPctGdp: 0.7,
      unemploymentRate: 5.1,
      povertyRate: 14.2,
      higherEducationShare: 28.9,
      migrationGrowth: -12.4,
      emissionsPerGdp: 3.5,
      roadsPerArea: 145.0,
    },
    2023: {
      gdpPerCapita: 448.9,
      avgSalary: 42.3,
      investmentPerCapita: 86.2,
      rdSpendingPctGdp: 0.7,
      unemploymentRate: 4.3,
      povertyRate: 13.5,
      higherEducationShare: 29.6,
      migrationGrowth: -15.1,
      emissionsPerGdp: 3.3,
      roadsPerArea: 148.0,
    },
    2024: {
      gdpPerCapita: 485.2,
      avgSalary: 47.1,
      investmentPerCapita: 94.8,
      rdSpendingPctGdp: 0.8,
      unemploymentRate: 3.8,
      povertyRate: 12.9,
      higherEducationShare: 30.2,
      migrationGrowth: -18.3,
      emissionsPerGdp: 3.1,
      roadsPerArea: 150.0,
    },
  },
  astrakhan: {
    2022: {
      gdpPerCapita: 580.4,
      avgSalary: 39.2,
      investmentPerCapita: 145.8,
      rdSpendingPctGdp: 0.3,
      unemploymentRate: 7.8,
      povertyRate: 15.8,
      higherEducationShare: 27.4,
      migrationGrowth: -8.6,
      emissionsPerGdp: 4.2,
      roadsPerArea: 78.0,
    },
    2023: {
      gdpPerCapita: 625.1,
      avgSalary: 43.8,
      investmentPerCapita: 158.3,
      rdSpendingPctGdp: 0.3,
      unemploymentRate: 6.9,
      povertyRate: 14.9,
      higherEducationShare: 28.1,
      migrationGrowth: -11.2,
      emissionsPerGdp: 3.9,
      roadsPerArea: 80.0,
    },
    2024: {
      gdpPerCapita: 672.8,
      avgSalary: 48.5,
      investmentPerCapita: 170.2,
      rdSpendingPctGdp: 0.4,
      unemploymentRate: 6.2,
      povertyRate: 14.1,
      higherEducationShare: 28.8,
      migrationGrowth: -14.5,
      emissionsPerGdp: 3.7,
      roadsPerArea: 82.0,
    },
  },
  kalmykia: {
    2022: {
      gdpPerCapita: 245.3,
      avgSalary: 30.1,
      investmentPerCapita: 42.5,
      rdSpendingPctGdp: 0.1,
      unemploymentRate: 10.2,
      povertyRate: 24.8,
      higherEducationShare: 25.1,
      migrationGrowth: -45.2,
      emissionsPerGdp: 1.2,
      roadsPerArea: 32.0,
    },
    2023: {
      gdpPerCapita: 268.7,
      avgSalary: 33.5,
      investmentPerCapita: 48.1,
      rdSpendingPctGdp: 0.1,
      unemploymentRate: 9.1,
      povertyRate: 23.4,
      higherEducationShare: 25.8,
      migrationGrowth: -52.8,
      emissionsPerGdp: 1.1,
      roadsPerArea: 33.0,
    },
    2024: {
      gdpPerCapita: 289.4,
      avgSalary: 36.8,
      investmentPerCapita: 52.3,
      rdSpendingPctGdp: 0.1,
      unemploymentRate: 8.4,
      povertyRate: 22.1,
      higherEducationShare: 26.4,
      migrationGrowth: -58.1,
      emissionsPerGdp: 1.0,
      roadsPerArea: 34.0,
    },
  },
  adygea: {
    2022: {
      gdpPerCapita: 285.6,
      avgSalary: 34.2,
      investmentPerCapita: 58.9,
      rdSpendingPctGdp: 0.2,
      unemploymentRate: 5.9,
      povertyRate: 13.9,
      higherEducationShare: 29.8,
      migrationGrowth: 42.1,
      emissionsPerGdp: 1.8,
      roadsPerArea: 265.0,
    },
    2023: {
      gdpPerCapita: 312.4,
      avgSalary: 38.1,
      investmentPerCapita: 65.7,
      rdSpendingPctGdp: 0.2,
      unemploymentRate: 5.1,
      povertyRate: 12.8,
      higherEducationShare: 30.5,
      migrationGrowth: 38.4,
      emissionsPerGdp: 1.7,
      roadsPerArea: 268.0,
    },
    2024: {
      gdpPerCapita: 338.9,
      avgSalary: 42.3,
      investmentPerCapita: 71.2,
      rdSpendingPctGdp: 0.2,
      unemploymentRate: 4.5,
      povertyRate: 11.9,
      higherEducationShare: 31.2,
      migrationGrowth: 35.6,
      emissionsPerGdp: 1.6,
      roadsPerArea: 272.0,
    },
  },
  stavropol: {
    2022: {
      gdpPerCapita: 352.1,
      avgSalary: 35.6,
      investmentPerCapita: 72.8,
      rdSpendingPctGdp: 0.5,
      unemploymentRate: 5.4,
      povertyRate: 14.5,
      higherEducationShare: 30.4,
      migrationGrowth: 8.3,
      emissionsPerGdp: 2.1,
      roadsPerArea: 195.0,
    },
    2023: {
      gdpPerCapita: 386.5,
      avgSalary: 39.8,
      investmentPerCapita: 81.4,
      rdSpendingPctGdp: 0.5,
      unemploymentRate: 4.6,
      povertyRate: 13.6,
      higherEducationShare: 31.1,
      migrationGrowth: 5.7,
      emissionsPerGdp: 2.0,
      roadsPerArea: 198.0,
    },
    2024: {
      gdpPerCapita: 418.2,
      avgSalary: 44.5,
      investmentPerCapita: 89.6,
      rdSpendingPctGdp: 0.6,
      unemploymentRate: 4.1,
      povertyRate: 12.8,
      higherEducationShare: 31.8,
      migrationGrowth: 3.2,
      emissionsPerGdp: 1.9,
      roadsPerArea: 201.0,
    },
  },
  dagestan: {
    2022: {
      gdpPerCapita: 218.4,
      avgSalary: 32.8,
      investmentPerCapita: 68.2,
      rdSpendingPctGdp: 0.1,
      unemploymentRate: 14.9,
      povertyRate: 17.8,
      higherEducationShare: 32.6,
      migrationGrowth: -28.4,
      emissionsPerGdp: 0.8,
      roadsPerArea: 142.0,
    },
    2023: {
      gdpPerCapita: 242.1,
      avgSalary: 36.4,
      investmentPerCapita: 75.8,
      rdSpendingPctGdp: 0.1,
      unemploymentRate: 13.1,
      povertyRate: 16.5,
      higherEducationShare: 33.4,
      migrationGrowth: -32.1,
      emissionsPerGdp: 0.7,
      roadsPerArea: 145.0,
    },
    2024: {
      gdpPerCapita: 265.8,
      avgSalary: 40.2,
      investmentPerCapita: 82.4,
      rdSpendingPctGdp: 0.2,
      unemploymentRate: 11.8,
      povertyRate: 15.2,
      higherEducationShare: 34.1,
      migrationGrowth: -36.7,
      emissionsPerGdp: 0.7,
      roadsPerArea: 148.0,
    },
  },
};

async function main() {
  console.log('Очистка базы данных...');
  await prisma.anomalyResult.deleteMany();
  await prisma.indicator.deleteMany();
  await prisma.report.deleteMany();
  await prisma.region.deleteMany();

  console.log('Загрузка регионов...');
  for (const region of regions) {
    await prisma.region.create({ data: region });
    console.log(`  + ${region.name}`);
  }

  console.log('Загрузка показателей 2022–2024...');
  for (const [regionId, years] of Object.entries(indicators)) {
    for (const [yearStr, data] of Object.entries(years)) {
      const year = parseInt(yearStr);
      await prisma.indicator.create({
        data: {
          regionId,
          year,
          ...data,
        },
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
