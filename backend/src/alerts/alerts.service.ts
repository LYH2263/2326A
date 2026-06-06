import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, Not } from 'typeorm';
import { Alert, AlertType, AlertStatus, AlertLevel } from './entities/alert.entity';
import { Animal } from '../animals/entities/animal.entity';
import { HealthRecord } from '../health/entities/health-record.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';
import dayjs from 'dayjs';
import { Subject } from 'rxjs';

export interface CreateAlertDto {
  animalId: number;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message?: string;
  relatedRecordId?: number;
  relatedRecordType?: string;
  triggeredAt?: Date;
}

@Injectable()
export class AlertsService implements OnModuleInit {
  private readonly logger = new Logger(AlertsService.name);
  private alertSubject = new Subject<Alert>();

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(HealthRecord)
    private readonly healthRecordRepository: Repository<HealthRecord>,
    @InjectRepository(FeedingRecord)
    private readonly feedingRecordRepository: Repository<FeedingRecord>,
  ) {}

  onModuleInit() {
    this.logger.log('AlertsService initialized');
  }

  getAlertSubject(): Subject<Alert> {
    return this.alertSubject;
  }

  emitAlert(alert: Alert) {
    this.alertSubject.next(alert);
  }

  async create(dto: CreateAlertDto): Promise<Alert> {
    const existing = await this.alertRepository.findOne({
      where: {
        animalId: dto.animalId,
        type: dto.type,
        status: Not('resolved'),
      },
      order: { createdAt: 'DESC' },
    });

    if (existing) {
      const hoursDiff = dayjs().diff(dayjs(existing.createdAt), 'hour');
      if (hoursDiff < 12) {
        return existing;
      }
    }

    const alert = this.alertRepository.create(dto);
    const saved = await this.alertRepository.save(alert);
    this.logger.log(`Created alert #${saved.id}: ${saved.title} for animal #${saved.animalId}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    status?: AlertStatus;
    type?: AlertType;
    level?: AlertLevel;
    animalId?: number;
  }): Promise<{ list: Alert[]; total: number }> {
    const { page = 1, pageSize = 20, status, type, level, animalId } = query;
    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (level) where.level = level;
    if (animalId) where.animalId = animalId;

    const [list, total] = await this.alertRepository.findAndCount({
      where,
      relations: ['animal'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: ['animal'],
    });
    if (!alert) {
      throw new NotFoundException(`预警 #${id} 不存在`);
    }
    return alert;
  }

  async markAsRead(id: number): Promise<Alert> {
    const alert = await this.findOne(id);
    if (alert.status === 'unread') {
      alert.status = 'read';
      return this.alertRepository.save(alert);
    }
    return alert;
  }

  async markAllAsRead(): Promise<number> {
    const result = await this.alertRepository.update(
      { status: 'unread' },
      { status: 'read' },
    );
    return result.affected || 0;
  }

  async markAsResolved(id: number): Promise<Alert> {
    const alert = await this.findOne(id);
    alert.status = 'resolved';
    return this.alertRepository.save(alert);
  }

  async getUnreadCount(): Promise<number> {
    return this.alertRepository.count({ where: { status: 'unread' } });
  }

  async getStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
  }> {
    const total = await this.alertRepository.count();
    const unread = await this.alertRepository.count({ where: { status: 'unread' } });

    const typeGroups = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.type')
      .getRawMany();

    const levelGroups = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.level')
      .getRawMany();

    const byType: Record<string, number> = {};
    typeGroups.forEach((g) => {
      byType[g.type] = parseInt(g.count, 10);
    });

    const byLevel: Record<string, number> = {};
    levelGroups.forEach((g) => {
      byLevel[g.level] = parseInt(g.count, 10);
    });

    return { total, unread, byType, byLevel };
  }

  async scanHealthAbnormal(): Promise<Alert[]> {
    this.logger.log('Scanning for health abnormal alerts...');
    const alerts: Alert[] = [];
    const threeDaysAgo = dayjs().subtract(3, 'day').toDate();

    const healthRecords = await this.healthRecordRepository
      .createQueryBuilder('hr')
      .innerJoinAndSelect('hr.animal', 'animal')
      .where('hr.condition IN (:...conditions)', { conditions: ['abnormal', 'critical'] })
      .andWhere('hr.check_date <= :threeDaysAgo', { threeDaysAgo })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(hr2.check_date)')
          .from(HealthRecord, 'hr2')
          .where('hr2.animal_id = hr.animal_id')
          .andWhere('hr2.condition = :normalCond', { normalCond: 'normal' })
          .getQuery();
        return `hr.check_date > COALESCE((${subQuery}), '1970-01-01')`;
      })
      .getMany();

    for (const record of healthRecords) {
      const daysSinceCheck = dayjs().diff(dayjs(record.checkDate), 'day');
      if (daysSinceCheck >= 3) {
        const alert = await this.create({
          animalId: record.animalId,
          type: 'health_abnormal',
          level: record.condition === 'critical' ? 'danger' : 'warning',
          title: `${record.animal.name} 健康异常未复查`,
          message: `健康状况为 ${record.condition === 'critical' ? '危重' : '异常'}，已超过 ${daysSinceCheck} 天未复查。上次检查日期：${dayjs(record.checkDate).format('YYYY-MM-DD')}，诊断：${record.diagnosis || '无'}`,
          relatedRecordId: record.id,
          relatedRecordType: 'health_record',
          triggeredAt: new Date(),
        });
        alerts.push(alert);
      }
    }

    this.logger.log(`Found ${alerts.length} health abnormal alerts`);
    return alerts;
  }

  async scanNextCheckOverdue(): Promise<Alert[]> {
    this.logger.log('Scanning for next check overdue alerts...');
    const alerts: Alert[] = [];
    const today = dayjs().startOf('day').toDate();

    const overdueRecords = await this.healthRecordRepository
      .createQueryBuilder('hr')
      .innerJoinAndSelect('hr.animal', 'animal')
      .where('hr.next_check_date IS NOT NULL')
      .andWhere('hr.next_check_date < :today', { today })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(hr2.check_date)')
          .from(HealthRecord, 'hr2')
          .where('hr2.animal_id = hr.animal_id')
          .getQuery();
        return `hr.check_date = (${subQuery})`;
      })
      .getMany();

    for (const record of overdueRecords) {
      const daysOverdue = dayjs().diff(dayjs(record.nextCheckDate), 'day');
      const alert = await this.create({
        animalId: record.animalId,
        type: 'next_check_overdue',
        level: daysOverdue > 7 ? 'danger' : 'warning',
        title: `${record.animal.name} 下次检查日期已过期`,
        message: `原定下次检查日期为 ${dayjs(record.nextCheckDate).format('YYYY-MM-DD')}，已逾期 ${daysOverdue} 天。请尽快安排复查。`,
        relatedRecordId: record.id,
        relatedRecordType: 'health_record',
        triggeredAt: new Date(),
      });
      alerts.push(alert);
    }

    this.logger.log(`Found ${alerts.length} next check overdue alerts`);
    return alerts;
  }

  async scanNoFeedingRecord(): Promise<Alert[]> {
    this.logger.log('Scanning for no feeding record alerts...');
    const alerts: Alert[] = [];
    const twoDaysAgo = dayjs().subtract(2, 'day').startOf('day').toDate();

    const animals = await this.animalRepository.find({
      where: { status: Not('deceased') },
    });

    for (const animal of animals) {
      const latestFeeding = await this.feedingRecordRepository.findOne({
        where: { animalId: animal.id },
        order: { feedDate: 'DESC' },
      });

      let shouldAlert = false;
      let daysWithoutFeeding = 0;

      if (!latestFeeding) {
        daysWithoutFeeding = dayjs().diff(dayjs(animal.createdAt), 'day');
        shouldAlert = daysWithoutFeeding >= 2;
      } else {
        daysWithoutFeeding = dayjs().diff(dayjs(latestFeeding.feedDate), 'day');
        shouldAlert = daysWithoutFeeding >= 2;
      }

      if (shouldAlert && daysWithoutFeeding > 0) {
        const alert = await this.create({
          animalId: animal.id,
          type: 'no_feeding_record',
          level: daysWithoutFeeding > 3 ? 'danger' : 'warning',
          title: `${animal.name} 连续无饲养记录`,
          message: `已连续 ${daysWithoutFeeding} 天无饲养记录。${latestFeeding ? `上次喂养日期：${dayjs(latestFeeding.feedDate).format('YYYY-MM-DD')}` : '尚无任何喂养记录'}`,
          relatedRecordId: latestFeeding?.id,
          relatedRecordType: 'feeding_record',
          triggeredAt: new Date(),
        });
        alerts.push(alert);
      }
    }

    this.logger.log(`Found ${alerts.length} no feeding record alerts`);
    return alerts;
  }

  async scanAll(): Promise<Alert[]> {
    this.logger.log('Starting full alert scan...');
    const allAlerts: Alert[] = [];

    try {
      const healthAlerts = await this.scanHealthAbnormal();
      allAlerts.push(...healthAlerts);
    } catch (error) {
      this.logger.error('Failed to scan health abnormal alerts', error);
    }

    try {
      const overdueAlerts = await this.scanNextCheckOverdue();
      allAlerts.push(...overdueAlerts);
    } catch (error) {
      this.logger.error('Failed to scan next check overdue alerts', error);
    }

    try {
      const feedingAlerts = await this.scanNoFeedingRecord();
      allAlerts.push(...feedingAlerts);
    } catch (error) {
      this.logger.error('Failed to scan no feeding record alerts', error);
    }

    this.logger.log(`Alert scan completed. Total new/active alerts: ${allAlerts.length}`);
    return allAlerts;
  }
}
