import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckupSchedulesService } from './checkup-schedules.service';

@Injectable()
export class CheckupScheduleTasksService {
  private readonly logger = new Logger(CheckupScheduleTasksService.name);

  constructor(private readonly checkupSchedulesService: CheckupSchedulesService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'mark-missed-schedules',
    timeZone: 'Asia/Shanghai',
  })
  async handleMissedSchedules() {
    this.logger.log('Starting daily missed schedules check...');
    try {
      const count = await this.checkupSchedulesService.markMissedSchedules();
      this.logger.log(`Daily missed schedules check completed. Marked ${count} schedules as missed.`);
    } catch (error) {
      this.logger.error('Failed to mark missed schedules', error);
    }
  }
}
