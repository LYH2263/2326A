import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { Alert } from './entities/alert.entity';
import { Animal } from '../animals/entities/animal.entity';
import { HealthRecord } from '../health/entities/health-record.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';
import { AlertTasksService } from './alert-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, Animal, HealthRecord, FeedingRecord])],
  controllers: [AlertsController],
  providers: [AlertsService, AlertTasksService],
  exports: [AlertsService],
})
export class AlertsModule {}
