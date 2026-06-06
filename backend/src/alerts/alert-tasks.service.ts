import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from './alerts.service';

@Injectable()
export class AlertTasksService {
  private readonly logger = new Logger(AlertTasksService.name);

  constructor(private readonly alertsService: AlertsService) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'alert-scan',
    timeZone: 'Asia/Shanghai',
  })
  async handleHourlyAlertScan() {
    this.logger.log('Starting hourly alert scan...');
    try {
      const alerts = await this.alertsService.scanAll();
      alerts.forEach((alert) => {
        this.alertsService.emitAlert(alert);
      });
      this.logger.log(`Hourly alert scan completed. Generated/Found ${alerts.length} alerts.`);
    } catch (error) {
      this.logger.error('Failed to run hourly alert scan', error);
    }
  }
}
