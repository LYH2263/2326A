import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { AnimalsModule } from '../animals/animals.module';
import { HealthModule } from '../health/health.module';
import { ExperimentsModule } from '../experiments/experiments.module';
import { FeedingModule } from '../feeding/feeding.module';

@Module({
  imports: [AnimalsModule, HealthModule, ExperimentsModule, FeedingModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
