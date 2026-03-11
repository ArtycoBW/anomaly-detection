import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RegionsModule } from './regions/regions.module';
import { AnomaliesModule } from './anomalies/anomalies.module';
import { MlModule } from './ml/ml.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RegionsModule,
    AnomaliesModule,
    MlModule,
    ReportModule,
  ],
})
export class AppModule {}
