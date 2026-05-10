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

# Русские названия для отображения на фронте
COLUMN_LABELS_RU = {
    "gdp_per_capita": "ВРП на душу населения",
    "avg_salary": "Средняя зарплата",
    "investment_per_capita": "Инвестиции на душу",
    "rd_spending_pct_gdp": "Расходы на НИОКР (% ВРП)",
    "unemployment_rate": "Безработица",
    "poverty_rate": "Бедность",
    "higher_education_share": "Высшее образование",
    "migration_growth": "Миграционный прирост",
    "emissions_per_gdp": "Выбросы на ВРП",
    "roads_per_area": "Плотность дорог",
}

# Путь к CSV с данными Росстата (data/indicators.csv в корне проекта)
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


def load_indicators(year: int) -> pd.DataFrame:
    """
    Загружает показатели всех регионов за указанный год.
    Приоритет: PostgreSQL → CSV fallback.
    """
    try:
        from db.connection import engine
        query = text("""
            SELECT region_id, gdp_per_capita, avg_salary, investment_per_capita,
                   rd_spending_pct_gdp, unemployment_rate, poverty_rate,
                   higher_education_share, migration_growth, emissions_per_gdp,
                   roads_per_area
            FROM indicators
            WHERE year = :year
            ORDER BY region_id
        """)
        df = pd.read_sql(query, engine, params={"year": year})
        if not df.empty:
            df = df.set_index("region_id")
            return df
    except Exception:
        pass

    return _load_from_csv(year)


def load_indicators_all_years() -> pd.DataFrame:
    """
    Загружает показатели всех регионов за все годы.
    Приоритет: PostgreSQL → CSV fallback.
    """
    try:
        from db.connection import engine
        query = text("""
            SELECT region_id, year, gdp_per_capita, avg_salary, investment_per_capita,
                   rd_spending_pct_gdp, unemployment_rate, poverty_rate,
                   higher_education_share, migration_growth, emissions_per_gdp,
                   roads_per_area
            FROM indicators
            ORDER BY region_id, year
        """)
        df = pd.read_sql(query, engine)
        if not df.empty:
            return df
    except Exception:
        pass

    return _load_from_csv_all_years()
