import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Все регионы с последними данными ансамблевого метода.
   */
  async findAll() {
    const regions = await this.prisma.region.findMany({
      include: {
        anomalies: {
          where: { method: 'ensemble' },
          orderBy: { year: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return regions.map((region) => ({
      id: region.id,
      name: region.name,
      federalDistrict: region.federalDistrict,
      latestAnomaly: region.anomalies[0] ?? null,
    }));
  }

  /**
   * Детальная информация о регионе с результатами всех методов.
   */
  async findOne(id: string) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        indicators: { orderBy: { year: 'desc' } },
        anomalies: { orderBy: [{ year: 'desc' }, { method: 'asc' }] },
      },
    });

    if (!region) {
      throw new NotFoundException(`Регион с id "${id}" не найден`);
    }

    return region;
  }

  /**
   * Показатели региона по годам.
   */
  async getIndicators(id: string) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) {
      throw new NotFoundException(`Регион с id "${id}" не найден`);
    }

    return this.prisma.indicator.findMany({
      where: { regionId: id },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Результаты аномалий для региона, опционально фильтр по году.
   */
  async getAnomalies(id: string, year?: number) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) {
      throw new NotFoundException(`Регион с id "${id}" не найден`);
    }

    const where: { regionId: string; year?: number } = { regionId: id };
    if (year) {
      where.year = year;
    }

    return this.prisma.anomalyResult.findMany({
      where,
      orderBy: [{ year: 'desc' }, { method: 'asc' }],
    });
  }
}
