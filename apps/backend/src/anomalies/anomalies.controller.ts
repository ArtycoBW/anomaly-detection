import { Controller, Get, Query } from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';
import { YearQueryDto, RequiredYearQueryDto } from '../common/dto/year-query.dto';

@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  findAll(@Query() query: YearQueryDto) {
    return this.anomaliesService.findAll(query.year);
  }

  @Get('heatmap')
  getHeatmap(@Query() query: RequiredYearQueryDto) {
    return this.anomaliesService.getHeatmap(query.year);
  }

  @Get('venn')
  getVenn(@Query() query: RequiredYearQueryDto) {
    return this.anomaliesService.getVenn(query.year);
  }

  @Get('proximity')
  getProximity(@Query() query: RequiredYearQueryDto) {
    return this.anomaliesService.getProximity(query.year);
  }

  @Get('comparison-table')
  getComparisonTable(@Query() query: RequiredYearQueryDto) {
    return this.anomaliesService.getComparisonTable(query.year);
  }

  @Get('timeline')
  getTimeline() {
    return this.anomaliesService.getTimeline();
  }
}
