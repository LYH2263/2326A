import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import dayjs from 'dayjs';
import { CheckupSchedule } from './entities/checkup-schedule.entity';
import { CreateCheckupScheduleDto } from './dto/create-checkup-schedule.dto';
import { UpdateCheckupScheduleDto } from './dto/update-checkup-schedule.dto';
import { BatchCreateCheckupScheduleDto } from './dto/batch-create-checkup-schedule.dto';
import { CompleteCheckupScheduleDto } from './dto/complete-checkup-schedule.dto';
import { Animal } from '../animals/entities/animal.entity';
import { HealthRecord } from '../health/entities/health-record.entity';

@Injectable()
export class CheckupSchedulesService {
  private readonly logger = new Logger(CheckupSchedulesService.name);

  constructor(
    @InjectRepository(CheckupSchedule)
    private readonly scheduleRepository: Repository<CheckupSchedule>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(HealthRecord)
    private readonly healthRecordRepository: Repository<HealthRecord>,
  ) {}

  async create(dto: CreateCheckupScheduleDto): Promise<CheckupSchedule> {
    const animal = await this.animalRepository.findOne({ where: { id: dto.animalId } });
    if (!animal) {
      throw new NotFoundException(`动物 #${dto.animalId} 不存在`);
    }
    const schedule = this.scheduleRepository.create(dto);
    const saved = await this.scheduleRepository.save(schedule);
    this.logger.log(`Created checkup schedule: ${saved.id} for animal ${saved.animalId}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    animalId?: number;
    status?: string;
    priority?: string;
    checkType?: string;
    veterinarian?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ list: CheckupSchedule[]; total: number }> {
    const { page = 1, pageSize = 10, animalId, status, priority, checkType, veterinarian, startDate, endDate } = query;
    const where: any = {};

    if (animalId) where.animalId = animalId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (checkType) where.checkType = checkType;
    if (veterinarian) where.veterinarian = veterinarian;
    if (startDate && endDate) {
      where.scheduledDate = Between(startDate, endDate);
    } else if (startDate) {
      where.scheduledDate = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.scheduledDate = LessThanOrEqual(endDate);
    }

    const [list, total] = await this.scheduleRepository.findAndCount({
      where,
      relations: ['animal'],
      order: { scheduledDate: 'ASC', timeSlot: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    filters?: {
      veterinarian?: string;
      checkType?: string;
      priority?: string;
      status?: string;
    },
  ): Promise<CheckupSchedule[]> {
    const where: any = {
      scheduledDate: Between(startDate, endDate),
    };

    if (filters?.veterinarian) where.veterinarian = filters.veterinarian;
    if (filters?.checkType) where.checkType = filters.checkType;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.status) where.status = filters.status;

    return this.scheduleRepository.find({
      where,
      relations: ['animal'],
      order: { scheduledDate: 'ASC', timeSlot: 'ASC', priority: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CheckupSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['animal', 'healthRecord'],
    });
    if (!schedule) {
      throw new NotFoundException(`体检排班 #${id} 不存在`);
    }
    return schedule;
  }

  async update(id: number, dto: UpdateCheckupScheduleDto): Promise<CheckupSchedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    const updated = await this.scheduleRepository.save(schedule);
    this.logger.log(`Updated checkup schedule: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
    this.logger.log(`Removed checkup schedule: ${id}`);
  }

  async batchCreate(dto: BatchCreateCheckupScheduleDto): Promise<{ count: number; schedules: CheckupSchedule[] }> {
    const { animalIds, startDate, intervalDays, times, ...rest } = dto;

    if (times <= 0) {
      throw new BadRequestException('次数必须大于0');
    }
    if (intervalDays < 0) {
      throw new BadRequestException('间隔天数不能为负数');
    }

    const animals = await this.animalRepository.find({
      where: { id: In(animalIds) },
    });

    if (animals.length === 0) {
      throw new NotFoundException('未找到指定动物');
    }

    const schedules: CheckupSchedule[] = [];

    for (const animal of animals) {
      for (let i = 0; i < times; i++) {
        const date = dayjs(startDate).add(i * intervalDays, 'day').format('YYYY-MM-DD');
        const schedule = this.scheduleRepository.create({
          animalId: animal.id,
          scheduledDate: date,
          ...rest,
        });
        schedules.push(schedule);
      }
    }

    const saved = await this.scheduleRepository.save(schedules);
    this.logger.log(`Batch created ${saved.length} checkup schedules for ${animals.length} animals`);

    return { count: saved.length, schedules: saved };
  }

  async complete(id: number, dto: CompleteCheckupScheduleDto): Promise<CheckupSchedule> {
    const schedule = await this.findOne(id);

    if (schedule.status === 'cancelled') {
      throw new BadRequestException('已取消的排班无法完成');
    }

    let healthRecordId = dto.healthRecordId;

    if (!healthRecordId) {
      const recordData: any = {
        animalId: schedule.animalId,
        checkDate: dto.checkDate || dayjs(schedule.scheduledDate).format('YYYY-MM-DD'),
        temperature: dto.temperature,
        weight: dto.weight,
        heartRate: dto.heartRate,
        respiratoryRate: dto.respiratoryRate,
        condition: dto.condition || 'normal',
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        veterinarian: dto.veterinarian || schedule.veterinarian,
        nextCheckDate: dto.nextCheckDate,
        notes: dto.notes,
      };

      const record = this.healthRecordRepository.create(recordData);
      const savedRecord = await this.healthRecordRepository.save(record) as unknown as HealthRecord;
      healthRecordId = savedRecord.id;
      this.logger.log(`Created health record ${savedRecord.id} from schedule ${id}`);
    }

    schedule.status = 'completed';
    schedule.healthRecordId = healthRecordId as number;
    const updated = await this.scheduleRepository.save(schedule);
    this.logger.log(`Completed checkup schedule: ${id}, linked to health record: ${healthRecordId}`);

    return updated;
  }

  async cancel(id: number, notes?: string): Promise<CheckupSchedule> {
    const schedule = await this.findOne(id);

    if (schedule.status === 'completed') {
      throw new BadRequestException('已完成的排班无法取消');
    }
    if (schedule.status === 'cancelled') {
      throw new BadRequestException('排班已取消');
    }

    schedule.status = 'cancelled';
    if (notes) {
      schedule.notes = schedule.notes ? schedule.notes + '\n' + notes : notes;
    }
    const updated = await this.scheduleRepository.save(schedule);
    this.logger.log(`Cancelled checkup schedule: ${id}`);
    return updated;
  }

  async markMissedSchedules(): Promise<number> {
    const today = dayjs().startOf('day').toDate();

    const schedulesToUpdate = await this.scheduleRepository.find({
      where: {
        status: 'scheduled',
        scheduledDate: LessThanOrEqual(today) as any,
      },
    });

    if (schedulesToUpdate.length === 0) {
      this.logger.log('No missed schedules to update');
      return 0;
    }

    for (const schedule of schedulesToUpdate) {
      schedule.status = 'missed';
    }

    const updated = await this.scheduleRepository.save(schedulesToUpdate);
    this.logger.log(`Marked ${updated.length} checkup schedules as missed`);
    return updated.length;
  }

  async getVeterinarians(): Promise<string[]> {
    const result = await this.scheduleRepository
      .createQueryBuilder('cs')
      .select('DISTINCT cs.veterinarian', 'veterinarian')
      .where('cs.veterinarian IS NOT NULL')
      .andWhere('cs.veterinarian != :empty', { empty: '' })
      .orderBy('cs.veterinarian', 'ASC')
      .getRawMany();

    return result.map((r) => r.veterinarian).filter(Boolean);
  }

  async getDailyStats(date: string): Promise<{ total: number; byPriority: Record<string, number>; byStatus: Record<string, number> }> {
    const schedules = await this.scheduleRepository.find({
      where: { scheduledDate: dayjs(date).toDate() as any },
    });

    const byPriority: Record<string, number> = { normal: 0, high: 0, urgent: 0 };
    const byStatus: Record<string, number> = { scheduled: 0, completed: 0, missed: 0, cancelled: 0 };

    for (const s of schedules) {
      if (byPriority[s.priority] !== undefined) byPriority[s.priority]++;
      if (byStatus[s.status] !== undefined) byStatus[s.status]++;
    }

    return {
      total: schedules.length,
      byPriority,
      byStatus,
    };
  }
}
