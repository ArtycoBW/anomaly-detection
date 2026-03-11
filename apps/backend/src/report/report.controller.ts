import { Controller, Get, Post, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ReportService, SseEvent } from './report.service';
import { RequiredYearQueryDto } from '../common/dto/year-query.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  generate(@Query() query: RequiredYearQueryDto) {
    return this.reportService.generate(query.year);
  }

  @Sse('stream')
  stream(@Query() query: RequiredYearQueryDto): Observable<SseEvent> {
    return this.reportService.streamReport(query.year);
  }

  @Get('latest')
  getLatest(@Query() query: RequiredYearQueryDto) {
    return this.reportService.getLatest(query.year);
  }
}
