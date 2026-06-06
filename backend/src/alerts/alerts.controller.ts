import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Sse,
  MessageEvent,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, Subject, interval, map } from 'rxjs';
import { AlertsService } from './alerts.service';
import { Alert, AlertType, AlertStatus, AlertLevel } from './entities/alert.entity';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('预警通知')
@Controller('alerts')
export class AlertsController {
  private readonly logger = new Logger(AlertsController.name);

  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: '获取预警列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: AlertStatus,
    @Query('type') type?: AlertType,
    @Query('level') level?: AlertLevel,
    @Query('animalId') animalId?: string,
  ): Promise<{ list: Alert[]; total: number }> {
    return this.alertsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      status,
      type,
      level,
      animalId: animalId ? parseInt(animalId, 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: '获取预警统计' })
  async getStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
  }> {
    return this.alertsService.getStats();
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读预警数量' })
  async getUnreadCount(): Promise<{ count: number }> {
    const count = await this.alertsService.getUnreadCount();
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取预警详情' })
  async findOne(@Param('id') id: string): Promise<Alert> {
    return this.alertsService.findOne(parseInt(id, 10));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记预警为已读' })
  async markAsRead(@Param('id') id: string): Promise<Alert> {
    return this.alertsService.markAsRead(parseInt(id, 10));
  }

  @Patch('read-all')
  @ApiOperation({ summary: '标记所有预警为已读' })
  async markAllAsRead(): Promise<{ count: number }> {
    const count = await this.alertsService.markAllAsRead();
    return { count };
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: '标记预警为已解决' })
  async markAsResolved(@Param('id') id: string): Promise<Alert> {
    return this.alertsService.markAsResolved(parseInt(id, 10));
  }

  @Post('scan')
  @ApiOperation({ summary: '手动触发预警扫描' })
  async scanAlerts(): Promise<{ alerts: Alert[]; count: number }> {
    const alerts = await this.alertsService.scanAll();
    alerts.forEach((alert) => this.alertsService.emitAlert(alert));
    return { alerts, count: alerts.length };
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE 实时推送预警' })
  streamAlerts(): Observable<MessageEvent> {
    const alertSubject = this.alertsService.getAlertSubject();
    return new Observable<MessageEvent>((observer) => {
      observer.next({
        type: 'connected',
        data: { message: 'SSE connection established' },
      } as MessageEvent);

      const subscription = alertSubject.subscribe({
        next: (alert) => {
          observer.next({
            type: 'new_alert',
            data: alert,
          } as MessageEvent);
        },
      });

      const heartbeat = setInterval(() => {
        observer.next({
          type: 'heartbeat',
          data: { timestamp: Date.now() },
        } as MessageEvent);
      }, 30000);

      return () => {
        subscription.unsubscribe();
        clearInterval(heartbeat);
      };
    });
  }
}
