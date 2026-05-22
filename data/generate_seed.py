"""
Преобразует strict data/indicators.csv в apps/backend/prisma/seed.ts.

Seed хранит в БД только строгие значения: пропуски остаются null. ML-пайплайн
готовит полную матрицу в памяти перед расчётом, чтобы UI/API не выдавали
подготовленные значения за сырую статистику Росстата.
"""

import pandas as pd

COLS = [
    "unemployment_rate", "avg_salary", "gdp_per_capita",
    "investment_per_capita", "poverty_rate", "higher_education_share",
    "rd_spending_pct_gdp", "migration_growth", "emissions_per_gdp",
    "roads_per_area",
]

YEARS = [2020, 2021, 2022, 2023, 2024]


def strict_region(df: pd.DataFrame, region_id: str) -> pd.DataFrame:
    """Return a strict 2020-2024 slice for a single region; keep NaN as missing."""
    sub = df[df["region_id"] == region_id].copy().sort_values("year")
    sub = sub.set_index("year").reindex(YEARS)
    sub["region_id"] = region_id
    return sub.reset_index()


def r(v: float | None, decimals: int = 1) -> str:
    """Round and format float/null for TypeScript."""
    if pd.isna(v):
        return "null"
    return str(round(float(v), decimals))


def main():
    df = pd.read_csv("data/indicators.csv")
    region_ids = df["region_id"].unique().tolist()
    region_meta = df[["region_id", "region_name", "federal_district"]].drop_duplicates()

    print("Готовлю strict seed по регионам...")
    strict: dict[str, pd.DataFrame] = {}
    for rid in region_ids:
        strict[rid] = strict_region(df, rid)

    all_strict = pd.concat(strict.values())
    print("\nПокрытие strict seed:")
    for c in COLS:
        n = all_strict[c].notna().sum()
        print(f"  {c}: {n}/{len(all_strict)} ({n*100//len(all_strict)}%)")

    print("\nПредпросмотр (Ростов):")
    print(strict["rostov"][["year"] + COLS].to_string(index=False))

    # ── Build TypeScript ──────────────────────────────────────────────────────
    lines = [
        'import { PrismaClient } from \'@prisma/client\';',
        '',
        'const prisma = new PrismaClient();',
        '',
        'const regions = [',
    ]

    district_map = {
        "ЮФО":  "Южный",
        "СКФО": "Северо-Кавказский",
    }
    for _, row in region_meta.iterrows():
        dist = district_map.get(row["federal_district"], row["federal_district"])
        lines.append(
            f"  {{ id: '{row['region_id']}', name: '{row['region_name']}', "
            f"federalDistrict: '{dist}' }},"
        )
    lines += ['];', '', '']

    lines += [
        '// Strict-значения из data/indicators.csv: пропуски остаются null.',
        '// ML-пайплайн заполняет gaps только в памяти перед расчётом.',
        '// Происхождение каждой ячейки см. в data/indicators_provenance.csv.',
        '// unemployment_rate — Уровень безработицы МОТ (%)',
        '// avg_salary — Среднемесячная начисленная зарплата (тыс. руб.)',
        '// gdp_per_capita — ВРП на душу населения (тыс. руб.)',
        '// investment_per_capita — Инвестиции в основной капитал на душу (тыс. руб.)',
        '// poverty_rate — Доля населения ниже границы бедности (%)',
        '// higher_education_share — официальный прокси: студенты вузов на 10000 чел. / 100',
        '// rd_spending_pct_gdp — Внутренние затраты на НИОКР / ВРП * 100 (%)',
        '// migration_growth — Миграционный прирост на 10000 чел.',
        '// emissions_per_gdp — Выбросы стац. источников (тыс.тонн) / ВРП (млрд руб.)',
        '// roads_per_area — официальная плотность дорог с твёрдым покрытием (км/1000 км²)',
        '',
        'const indicators: Record<string, Record<number, {',
        '  gdpPerCapita: number | null;',
        '  avgSalary: number | null;',
        '  investmentPerCapita: number | null;',
        '  rdSpendingPctGdp: number | null;',
        '  unemploymentRate: number | null;',
        '  povertyRate: number | null;',
        '  higherEducationShare: number | null;',
        '  migrationGrowth: number | null;',
        '  emissionsPerGdp: number | null;',
        '  roadsPerArea: number | null;',
        '}>> = {',
    ]

    for rid in region_ids:
        lines.append(f'  {rid}: {{')
        sub = strict[rid].sort_values("year")
        for _, row in sub.iterrows():
            y = int(row["year"])
            lines.append(f'    {y}: {{')
            lines.append(f'      gdpPerCapita:          {r(row["gdp_per_capita"])},')
            lines.append(f'      avgSalary:             {r(row["avg_salary"])},')
            lines.append(f'      investmentPerCapita:   {r(row["investment_per_capita"])},')
            lines.append(f'      rdSpendingPctGdp:      {r(row["rd_spending_pct_gdp"], 2)},')
            lines.append(f'      unemploymentRate:      {r(row["unemployment_rate"])},')
            lines.append(f'      povertyRate:           {r(row["poverty_rate"])},')
            lines.append(f'      higherEducationShare:  {r(row["higher_education_share"])},')
            lines.append(f'      migrationGrowth:       {r(row["migration_growth"])},')
            lines.append(f'      emissionsPerGdp:       {r(row["emissions_per_gdp"], 2)},')
            lines.append(f'      roadsPerArea:          {r(row["roads_per_area"])},')
            lines.append('    },')
        lines.append('  },')

    lines += [
        '};',
        '',
        'async function main() {',
        "  console.log('Upsert регионов...');",
        '  for (const region of regions) {',
        '    await prisma.region.upsert({',
        '      where: { id: region.id },',
        '      create: region,',
        '      update: {',
        '        name: region.name,',
        '        federalDistrict: region.federalDistrict,',
        '      },',
        '    });',
        "    console.log(`  + ${region.name}`);",
        '  }',
        '',
        "  console.log('Upsert strict-показателей 2020–2024...');",
        '  for (const [regionId, years] of Object.entries(indicators)) {',
        '    for (const [yearStr, data] of Object.entries(years)) {',
        '      const year = parseInt(yearStr);',
        '      await prisma.indicator.upsert({',
        '        where: {',
        '          regionId_year: { regionId, year },',
        '        },',
        '        create: { regionId, year, ...data },',
        '        update: data,',
        '      });',
        "      console.log(`  + ${regionId} / ${year}`);",
        '    }',
        '  }',
        '',
        '  const regionCount = await prisma.region.count();',
        '  const indicatorCount = await prisma.indicator.count();',
        "  console.log(`\\nГотово! Загружено: ${regionCount} регионов, ${indicatorCount} записей показателей`);",
        '}',
        '',
        'main()',
        '  .catch((e) => {',
        "    console.error('Ошибка seed:', e);",
        '    process.exit(1);',
        '  })',
        '  .finally(async () => {',
        '    await prisma.$disconnect();',
        '  });',
    ]

    out = "\n".join(lines) + "\n"
    with open("apps/backend/prisma/seed.ts", "w", encoding="utf-8") as f:
        f.write(out)
    print("\n[OK] apps/backend/prisma/seed.ts обновлён")


if __name__ == "__main__":
    main()
