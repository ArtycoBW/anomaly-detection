-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "federal_district" TEXT NOT NULL,
    "geo_json" JSONB,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicators" (
    "id" SERIAL NOT NULL,
    "region_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "gdp_per_capita" DOUBLE PRECISION,
    "avg_salary" DOUBLE PRECISION,
    "investment_per_capita" DOUBLE PRECISION,
    "rd_spending_pct_gdp" DOUBLE PRECISION,
    "unemployment_rate" DOUBLE PRECISION,
    "poverty_rate" DOUBLE PRECISION,
    "higher_education_share" DOUBLE PRECISION,
    "migration_growth" DOUBLE PRECISION,
    "emissions_per_gdp" DOUBLE PRECISION,
    "roads_per_area" DOUBLE PRECISION,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly_results" (
    "id" SERIAL NOT NULL,
    "region_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "is_anomaly" BOOLEAN NOT NULL,
    "z_scores" JSONB,
    "shap_values" JSONB,
    "stability_status" TEXT,

    CONSTRAINT "anomaly_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicators_region_id_year_key" ON "indicators"("region_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "anomaly_results_region_id_year_method_key" ON "anomaly_results"("region_id", "year", "method");

-- AddForeignKey
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomaly_results" ADD CONSTRAINT "anomaly_results_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
