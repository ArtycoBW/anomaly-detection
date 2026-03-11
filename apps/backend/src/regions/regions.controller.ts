import { Controller, Get, Param, Query } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { YearQueryDto } from '../common/dto/year-query.dto';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  findAll() {
    return this.regionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Get(':id/indicators')
  getIndicators(@Param('id') id: string) {
    return this.regionsService.getIndicators(id);
  }

  @Get(':id/anomalies')
  getAnomalies(@Param('id') id: string, @Query() query: YearQueryDto) {
    return this.regionsService.getAnomalies(id, query.year);
  }
}
