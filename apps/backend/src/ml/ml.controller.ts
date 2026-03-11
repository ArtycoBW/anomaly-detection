import { Controller, Get, Post, Query } from '@nestjs/common';
import { MlService } from './ml.service';
import { RequiredYearQueryDto } from '../common/dto/year-query.dto';

@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('run')
  runPipeline(@Query() query: RequiredYearQueryDto) {
    return this.mlService.runPipeline(query.year);
  }

  @Get('status')
  getStatus() {
    return this.mlService.getStatus();
  }
}
