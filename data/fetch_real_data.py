"""
Скачивает строгий слой данных Росстата/tochno.st и генерирует:
- data/indicators.csv: широкая матрица показателей для 8 регионов, 2020-2024;
- data/indicators_provenance.csv: происхождение каждой ячейки и статус качества.

Принцип strict layer: пропуски не интерполируются и не заменяются экспертными
оценками. Производные показатели считаются только из официальных рядов.
"""

from __future__ import annotations

import io
import time
import zipfile
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
import requests

BASE = (
    "https://storage.yandexcloud.net/tochno-st-catalog/Rosstat/"
    "data_regions_collection_102_v20260313/"
)

COLLECTIONS = {
    "population": "data_01_socio_economic_102_v20260313.zip",
    "labor": "data_02_socio_economic_102_v20260313.zip",
    "living": "data_03_socio_economic_102_v20260313.zip",
    "education": "data_04_socio_economic_102_v20260313.zip",
    "environment": "data_07_socio_economic_102_v20260313.zip",
    "grp": "data_08_socio_economic_102_v20260313.zip",
    "investment": "data_10_socio_economic_102_v20260313.zip",
    "transport": "data_16_socio_economic_102_v20260313.zip",
    "science": "data_18_socio_economic_102_v20260313.zip",
}

REGION_MAP = {
    "Ростовская область": ("rostov", "Ростовская область", "ЮФО"),
    "Краснодарский край": ("krasnodar", "Краснодарский край", "ЮФО"),
    "Волгоградская область": ("volgograd", "Волгоградская область", "ЮФО"),
    "Астраханская область": ("astrakhan", "Астраханская область", "ЮФО"),
    "Республика Калмыкия": ("kalmykia", "Республика Калмыкия", "ЮФО"),
    "Республика Адыгея": ("adygea", "Республика Адыгея", "ЮФО"),
    "Ставропольский край": ("stavropol", "Ставропольский край", "СКФО"),
    "Республика Дагестан": ("dagestan", "Республика Дагестан", "СКФО"),
}

YEARS = [2020, 2021, 2022, 2023, 2024]

OUTPUT_DIR = Path(__file__).resolve().parent
INDICATORS_CSV = OUTPUT_DIR / "indicators.csv"
PROVENANCE_CSV = OUTPUT_DIR / "indicators_provenance.csv"


@dataclass(frozen=True)
class SourceSpec:
    collection: str
    code: str
    method: str
    note: str = ""
    unit_contains: str | None = None

    @property
    def source_url(self) -> str:
        return BASE + COLLECTIONS[self.collection]


SPECS: dict[str, SourceSpec] = {
    "unemployment_rate": SourceSpec(
        "labor",
        "Y477110418",
        "official",
        "Уровень безработицы по данным выборочных обследований рабочей силы, %",
    ),
    "avg_salary": SourceSpec(
        "living",
        "Y477110378",
        "official / 1000",
        "Среднемесячная номинальная начисленная зарплата работников организаций: руб. -> тыс. руб.",
    ),
    "gdp_per_capita": SourceSpec(
        "grp",
        "Y477110006",
        "official / 1000",
        "ВРП на душу населения: руб. -> тыс. руб.; в текущей коллекции ряд доступен до 2023 года.",
    ),
    "investment_per_capita": SourceSpec(
        "investment",
        "Y477110108",
        "official / 1000",
        "Инвестиции в основной капитал на душу населения: руб. -> тыс. руб.",
    ),
    "poverty_rate": SourceSpec(
        "living",
        "Y477110463",
        "official",
        "Доля населения с денежными доходами ниже границы бедности / величины прожиточного минимума, %.",
    ),
    "higher_education_share": SourceSpec(
        "education",
        "Y477110485",
        "official proxy / 100",
        "Прокси: студенты программ бакалавриата/специалитета/магистратуры на 10000 человек населения / 100. "
        "Это не точный показатель 'доля занятого населения с высшим образованием'.",
    ),
    "migration_growth": SourceSpec(
        "population",
        "Y477110197",
        "official",
        "Коэффициент миграционного прироста на 10000 человек населения; в текущей коллекции ряд доступен до 2023 года.",
    ),
    "roads_per_area": SourceSpec(
        "transport",
        "Y477110295",
        "official",
        "Плотность автомобильных дорог общего пользования с твердым покрытием, км дорог на 1000 км2 территории.",
        unit_contains="км дорог",
    ),
}

DERIVED_SPECS = {
    "rd_spending_pct_gdp": (
        SourceSpec(
            "science",
            "Y477110039",
            "derived numerator",
            "Внутренние затраты на НИОКР, млн руб.",
        ),
        SourceSpec(
            "grp",
            "Y477110005",
            "derived denominator",
            "ВРП, млн руб.",
        ),
        "Внутренние затраты на НИОКР / ВРП * 100. Для 2024 нужен официальный ВРП-2024.",
    ),
    "emissions_per_gdp": (
        SourceSpec(
            "environment",
            "Y477110053",
            "derived numerator",
            "Выбросы загрязняющих веществ от стационарных источников, тыс. тонн.",
            unit_contains="Тысяч тонн",
        ),
        SourceSpec(
            "grp",
            "Y477110005",
            "derived denominator",
            "ВРП, млн руб.",
        ),
        "Выбросы, тыс. тонн / ВРП, млрд руб. = тонн на 1 млн руб. ВРП. Для 2024 нужен официальный ВРП-2024.",
    ),
}


def fetch(collection: str, filename: str) -> pd.DataFrame:
    url = BASE + filename
    print(f"  {collection}...", end=" ", flush=True)
    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            response = requests.get(url, timeout=120)
            response.raise_for_status()
            break
        except requests.RequestException as error:
            last_error = error
            if attempt == 3:
                raise
            time.sleep(attempt * 3)
    else:
        raise RuntimeError(f"Не удалось скачать {url}: {last_error}")

    with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
        csv_files = [name for name in archive.namelist() if name.endswith(".csv")]
        if not csv_files:
            raise RuntimeError(f"В архиве {filename} не найден CSV")
        with archive.open(csv_files[0]) as file:
            df = pd.read_csv(file, sep=";", encoding="utf-8", low_memory=False)

    df["indicator_value"] = pd.to_numeric(df["indicator_value"], errors="coerce")
    print(f"OK ({len(df):,} строк)")
    return df


def value(
    dfs: dict[str, pd.DataFrame],
    spec: SourceSpec,
    region: str,
    year: int,
) -> tuple[float | None, dict[str, str | None]]:
    df = dfs[spec.collection]
    mask = (
        (df["object_name"] == region)
        & (df["year"] == year)
        & (df["indicator_code"] == spec.code)
    )
    if spec.unit_contains:
        preferred = df[mask & df["indicator_unit"].str.contains(spec.unit_contains, na=False, regex=False)]
        rows = preferred if not preferred.empty else df[mask]
    else:
        rows = df[mask]

    rows = rows.dropna(subset=["indicator_value"]).drop_duplicates(
        subset=["object_name", "year", "indicator_code", "indicator_value"]
    )
    meta = {
        "source_name": rows["source"].iloc[0] if not rows.empty and "source" in rows else "Росстат / tochno.st",
        "source_url": spec.source_url,
        "indicator_code": spec.code,
        "version_date": rows["version_date"].iloc[0] if not rows.empty and "version_date" in rows else None,
    }

    if rows.empty:
        return None, meta

    return float(rows["indicator_value"].iloc[0]), meta


def transform(indicator: str, raw: float | None) -> float | None:
    if raw is None:
        return None
    if indicator in {"avg_salary", "gdp_per_capita", "investment_per_capita"}:
        return round(raw / 1000, 1)
    if indicator == "higher_education_share":
        return round(raw / 100, 1)
    if indicator in {"unemployment_rate", "poverty_rate", "migration_growth"}:
        return round(raw, 1)
    if indicator == "roads_per_area":
        return round(raw, 1)
    return round(raw, 4)


def provenance_row(
    region_id: str,
    region_name: str,
    year: int,
    indicator: str,
    val: float | None,
    status: str,
    meta: dict[str, str | None],
    method: str,
    note: str,
) -> dict[str, str | int | float | None]:
    return {
        "region_id": region_id,
        "region_name": region_name,
        "year": year,
        "indicator": indicator,
        "value": val,
        "status": status,
        "source_name": meta.get("source_name"),
        "source_url": meta.get("source_url"),
        "indicator_code": meta.get("indicator_code"),
        "version_date": meta.get("version_date"),
        "method": method,
        "note": note,
    }


def direct_indicator(
    dfs: dict[str, pd.DataFrame],
    indicator: str,
    region: str,
    region_id: str,
    region_name: str,
    year: int,
) -> tuple[float | None, dict[str, str | int | float | None]]:
    spec = SPECS[indicator]
    raw, meta = value(dfs, spec, region, year)
    val = transform(indicator, raw)
    if val is None:
        status = "missing"
    elif indicator == "higher_education_share":
        status = "official_proxy"
    else:
        status = "official"

    return val, provenance_row(
        region_id,
        region_name,
        year,
        indicator,
        val,
        status,
        meta,
        spec.method,
        spec.note,
    )


def derived_indicator(
    dfs: dict[str, pd.DataFrame],
    indicator: str,
    region: str,
    region_id: str,
    region_name: str,
    year: int,
) -> tuple[float | None, dict[str, str | int | float | None]]:
    numerator_spec, denominator_spec, note = DERIVED_SPECS[indicator]
    numerator, numerator_meta = value(dfs, numerator_spec, region, year)
    denominator, denominator_meta = value(dfs, denominator_spec, region, year)

    if numerator is None or denominator is None or denominator == 0:
        source_url = f"{numerator_spec.source_url}; {denominator_spec.source_url}"
        code = f"{numerator_spec.code}; {denominator_spec.code}"
        meta = {
            "source_name": "Росстат / tochno.st",
            "source_url": source_url,
            "indicator_code": code,
            "version_date": numerator_meta.get("version_date") or denominator_meta.get("version_date"),
        }
        val = None
        status = "missing"
    else:
        if indicator == "rd_spending_pct_gdp":
            val = round(numerator / denominator * 100, 2)
        elif indicator == "emissions_per_gdp":
            # numerator: тыс. тонн; denominator: млн руб. -> млрд руб.
            val = round(numerator / (denominator / 1000), 2)
        else:
            raise ValueError(f"Неизвестный производный показатель: {indicator}")

        meta = {
            "source_name": "Росстат / tochno.st",
            "source_url": f"{numerator_spec.source_url}; {denominator_spec.source_url}",
            "indicator_code": f"{numerator_spec.code}; {denominator_spec.code}",
            "version_date": numerator_meta.get("version_date") or denominator_meta.get("version_date"),
        }
        status = "derived_from_official"

    return val, provenance_row(
        region_id,
        region_name,
        year,
        indicator,
        val,
        status,
        meta,
        "computed from official source rows",
        note,
    )


def main() -> None:
    print("=== Загружаю официальные ряды Росстата/tochno.st ===\n")
    dfs = {name: fetch(name, filename) for name, filename in COLLECTIONS.items()}

    print("\n=== Генерирую strict indicators.csv + provenance ===")
    rows: list[dict[str, str | int | float | None]] = []
    provenance: list[dict[str, str | int | float | None]] = []

    direct_keys = [
        "unemployment_rate",
        "avg_salary",
        "gdp_per_capita",
        "investment_per_capita",
        "poverty_rate",
        "higher_education_share",
        "migration_growth",
        "roads_per_area",
    ]
    derived_keys = ["rd_spending_pct_gdp", "emissions_per_gdp"]

    for rosstat_name, (region_id, region_name, district) in REGION_MAP.items():
        for year in YEARS:
            row: dict[str, str | int | float | None] = {
                "region_id": region_id,
                "region_name": region_name,
                "federal_district": district,
                "year": year,
            }

            for key in direct_keys:
                val, meta_row = direct_indicator(dfs, key, rosstat_name, region_id, region_name, year)
                row[key] = val
                provenance.append(meta_row)

            for key in derived_keys:
                val, meta_row = derived_indicator(dfs, key, rosstat_name, region_id, region_name, year)
                row[key] = val
                provenance.append(meta_row)

            rows.append(row)

    columns = [
        "region_id",
        "region_name",
        "federal_district",
        "year",
        "unemployment_rate",
        "avg_salary",
        "gdp_per_capita",
        "investment_per_capita",
        "poverty_rate",
        "higher_education_share",
        "rd_spending_pct_gdp",
        "migration_growth",
        "emissions_per_gdp",
        "roads_per_area",
    ]
    df_out = pd.DataFrame(rows)[columns]
    df_prov = pd.DataFrame(provenance)

    df_out.to_csv(INDICATORS_CSV, index=False, encoding="utf-8")
    df_prov.to_csv(PROVENANCE_CSV, index=False, encoding="utf-8")

    print("\nПокрытие strict layer:")
    for column in columns[4:]:
        n = int(df_out[column].notna().sum())
        print(f"  {column}: {n}/{len(df_out)} ({n * 100 // len(df_out)}%)")

    status_counts = (
        df_prov.groupby(["indicator", "status"], dropna=False)
        .size()
        .reset_index(name="count")
        .sort_values(["indicator", "status"])
    )
    print("\nСтатусы provenance:")
    print(status_counts.to_string(index=False))

    print(f"\n[OK] {INDICATORS_CSV} сохранён ({len(df_out)} строк)")
    print(f"[OK] {PROVENANCE_CSV} сохранён ({len(df_prov)} строк)")


if __name__ == "__main__":
    main()
