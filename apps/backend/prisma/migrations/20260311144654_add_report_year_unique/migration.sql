/*
  Warnings:

  - A unique constraint covering the columns `[year]` on the table `reports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "reports_year_key" ON "reports"("year");
