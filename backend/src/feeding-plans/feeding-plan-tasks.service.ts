import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FeedingPlansService } from './feeding-plans.service';

@Injectable()
export class FeedingPlanTasksService {
  private readonly logger = new Logger(FeedingPlanTasksService.name);

  constructor(private readonly feedingPlansService: FeedingPlansService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'generate-daily-feeding-tasks',
    timeZone: 'Asia/Shanghai',
  })
  async handleDailyTaskGeneration() {
    this.logger.log('Starting daily feeding tasks generation...');
    try {
      const result = await this.feedingPlansService.generateDailyTasks();
      this.logger.log(`Daily feeding tasks generation completed. Generated ${result.count} tasks created.`);
    } catch (error) {
      this.logger.error('Failed to generate daily feeding tasks', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'mark-missed-feeding-tasks',
    timeZone: 'Asia/Shanghai',
  })
  async handleMissedTasks() {
    this.logger.log('Starting daily missed tasks check...');
    try {
      const count = await this.feedingPlansService.markMissedTasks();
      this.logger.log(`Daily missed tasks check completed. Marked ${count} tasks as missed.`);
    } catch (error) {
      this.logger.error('Failed to mark missed tasks', error);
    }
  }
}
