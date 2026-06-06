import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckupSchedulesService } from './checkup-schedules.service';
import { CheckupSchedulesController } from './checkup-schedules.controller';
import { CheckupSchedule } from './entities/checkup-schedule.entity';
import { Animal } from '../animals/entities/animal.entity';
import { HealthRecord } from '../health/entities/health-record.entity';
import { CheckupScheduleTasksService } from './checkup-schedule-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([CheckupSchedule, Animal, HealthRecord])],
  controllers: [CheckupSchedulesController],
  providers: [CheckupSchedulesService, CheckupScheduleTasksService],
  exports: [CheckupSchedulesService],
})
export class CheckupSchedulesModule {}
