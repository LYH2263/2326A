import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedingPlansService } from './feeding-plans.service';
import { FeedingPlansController } from './feeding-plans.controller';
import { FeedingPlan } from './entities/feeding-plan.entity';
import { FeedingTask } from './entities/feeding-task.entity';
import { Animal } from '../animals/entities/animal.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';
import { FeedingPlanTasksService } from './feeding-plan-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeedingPlan, FeedingTask, Animal, FeedingRecord])],
  controllers: [FeedingPlansController],
  providers: [FeedingPlansService, FeedingPlanTasksService],
  exports: [FeedingPlansService],
})
export class FeedingPlansModule {}
