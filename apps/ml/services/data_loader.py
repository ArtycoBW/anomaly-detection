import pandas as pd
from sqlalchemy import text
from db.connection import engine

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


def load_indicators(year: int) -> pd.DataFrame:
    """Загружает показатели всех регионов за указанный год из PostgreSQL."""
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
    df = df.set_index("region_id")
    return df


def load_indicators_all_years() -> pd.DataFrame:
    """Загружает показатели всех регионов за все годы."""
    query = text("""
        SELECT region_id, year, gdp_per_capita, avg_salary, investment_per_capita,
               rd_spending_pct_gdp, unemployment_rate, poverty_rate,
               higher_education_share, migration_growth, emissions_per_gdp,
               roads_per_area
        FROM indicators
        ORDER BY region_id, year
    """)
    df = pd.read_sql(query, engine)
    return df
