import os
import pandas as pd
from sqlalchemy import text

INDICATOR_COLUMNS = [
    "gdp_per_capita",
    "avg_salary",
    "investment_per_capita",
    "rd_spending_pct_gdp",
    "unemployment_rate",
    "poverty_rate",
    "higher_education_share",
    "migration_growth",
    "emissions_per_gdp",
    "roads_per_area",
]

YEARS = [2020, 2021, 2022, 2023, 2024]

# Русские названия для отображения на фронте
COLUMN_LABELS_RU = {
    "gdp_per_capita": "ВРП на душу населения",
    "avg_salary": "Средняя зарплата",
    "investment_per_capita": "Инвестиции на душу",
    "rd_spending_pct_gdp": "Расходы на НИОКР (% ВРП)",
    "unemployment_rate": "Безработица",
    "poverty_rate": "Бедность",
    "higher_education_share": "Студенты вузов / 10 тыс.",
    "migration_growth": "Миграционный прирост",
    "emissions_per_gdp": "Выбросы на ВРП",
    "roads_per_area": "Плотность дорог",
}

# Путь к strict CSV с данными Росстата (data/indicators.csv в корне проекта).
CSV_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "data", "indicators.csv"
)


def _load_from_csv(year: int) -> pd.DataFrame:
    """Загружает показатели из CSV-файла (data/indicators.csv)."""
    csv_path = os.path.normpath(CSV_PATH)
    df = pd.read_csv(csv_path)
    df = df[df["year"] == year].copy()
    df = df.set_index("region_id")
    return df[INDICATOR_COLUMNS]


def _load_from_csv_all_years() -> pd.DataFrame:
    """Загружает все годы из CSV."""
    csv_path = os.path.normpath(CSV_PATH)
    df = pd.read_csv(csv_path)
    return df[["region_id", "year"] + INDICATOR_COLUMNS]


def _load_from_db_all_years() -> pd.DataFrame:
    """Загружает strict-показатели всех лет из PostgreSQL."""
    from db.connection import engine

    query = text("""
        SELECT region_id, year, gdp_per_capita, avg_salary, investment_per_capita,
               rd_spending_pct_gdp, unemployment_rate, poverty_rate,
               higher_education_share, migration_growth, emissions_per_gdp,
               roads_per_area
        FROM indicators
        ORDER BY region_id, year
    """)
    return pd.read_sql(query, engine)


def _prepare_for_ml(df: pd.DataFrame) -> pd.DataFrame:
    """
    Готовит полную матрицу только для ML-расчётов.

    Strict-источник остаётся с NaN/null. Здесь пропуски внутри временного ряда
    региона заполняются детерминированно, чтобы алгоритмы получили полный
    10-показательный вектор.
    """
    if df.empty:
        return df

    prepared = []
    for region_id, group in df.groupby("region_id"):
        sub = group.copy().sort_values("year").set_index("year").reindex(YEARS)
        sub["region_id"] = region_id

        for col in INDICATOR_COLUMNS:
            series = pd.to_numeric(sub[col], errors="coerce")
            if series.notna().any():
                series = series.interpolate(method="linear", limit_direction="both")
                series = series.bfill().ffill()
            sub[col] = series

        prepared.append(sub.reset_index())

    result = pd.concat(prepared, ignore_index=True)

    result["unemployment_rate"] = result["unemployment_rate"].clip(0, 50)
    result["poverty_rate"] = result["poverty_rate"].clip(0, 60)
    result["higher_education_share"] = result["higher_education_share"].clip(0, 15)
    result["rd_spending_pct_gdp"] = result["rd_spending_pct_gdp"].clip(0, 5)
    result["emissions_per_gdp"] = result["emissions_per_gdp"].clip(0, 10)
    result["avg_salary"] = result["avg_salary"].clip(10, 300)
    result["gdp_per_capita"] = result["gdp_per_capita"].clip(50, 5000)

    missing = result[INDICATOR_COLUMNS].isna().sum()
    still_missing = missing[missing > 0]
    if not still_missing.empty:
        raise ValueError(
            "Недостаточно данных для подготовки ML-матрицы: "
            + ", ".join(f"{col}={count}" for col, count in still_missing.items())
        )

    return result[["region_id", "year"] + INDICATOR_COLUMNS]


def load_indicators(year: int) -> pd.DataFrame:
    """
    Загружает показатели всех регионов за указанный год.
    Приоритет: PostgreSQL → CSV fallback. Возвращает prepared-копию для ML;
    исходные strict-значения в БД/CSV не изменяются.
    """
    try:
        df = _load_from_db_all_years()
        if not df.empty:
            prepared = _prepare_for_ml(df)
            year_df = prepared[prepared["year"] == year].copy()
            return year_df.set_index("region_id")[INDICATOR_COLUMNS]
    except Exception:
        pass

    df = _prepare_for_ml(_load_from_csv_all_years())
    year_df = df[df["year"] == year].copy()
    return year_df.set_index("region_id")[INDICATOR_COLUMNS]


def load_indicators_all_years() -> pd.DataFrame:
    """
    Загружает показатели всех регионов за все годы.
    Приоритет: PostgreSQL → CSV fallback. Возвращает prepared-копию для ML.
    """
    try:
        df = _load_from_db_all_years()
        if not df.empty:
            return _prepare_for_ml(df)
    except Exception:
        pass

    return _prepare_for_ml(_load_from_csv_all_years())
