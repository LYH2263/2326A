import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import dayjs from 'dayjs';
import { FeedingPlan } from './entities/feeding-plan.entity';
import { FeedingTask } from './entities/feeding-task.entity';
import { CreateFeedingPlanDto } from './dto/create-feeding-plan.dto';
import { UpdateFeedingPlanDto } from './dto/update-feeding-plan.dto';
import { CompleteFeedingTaskDto } from './dto/complete-feeding-task.dto';
import { Animal } from '../animals/entities/animal.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';

@Injectable()
export class FeedingPlansService {
  private readonly logger = new Logger(FeedingPlansService.name);

  constructor(
    @InjectRepository(FeedingPlan)
    private readonly planRepository: Repository<FeedingPlan>,
    @InjectRepository(FeedingTask)
    private readonly taskRepository: Repository<FeedingTask>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(FeedingRecord)
    private readonly feedingRecordRepository: Repository<FeedingRecord>,
  ) {}

  async create(dto: CreateFeedingPlanDto): Promise<FeedingPlan> {
    if (dto.targetType === 'animal' && !dto.animalId) {
      throw new BadRequestException('选择动物目标类型时必须指定动物ID');
    }
    if (dto.targetType === 'cage' && !dto.cageNumber) {
      throw new BadRequestException('选择笼位目标类型时必须指定笼号');
    }

    const plan = this.planRepository.create(dto as any) as unknown as FeedingPlan;
    const saved = await this.planRepository.save(plan);
    this.logger.log(`Created feeding plan: ${saved.id} - ${saved.planName}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    targetType?: string;
    feeder?: string;
    foodType?: string;
  }): Promise<{ list: FeedingPlan[]; total: number }> {
    const { page = 1, pageSize = 10, status, targetType, feeder, foodType } = query;
    const where: any = {};

    if (status) where.status = status;
    if (targetType) where.targetType = targetType;
    if (feeder) where.feeder = feeder;
    if (foodType) where.foodType = foodType;

    const [list, total] = await this.planRepository.findAndCount({
      where,
      relations: ['animal'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<FeedingPlan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['animal'],
    });
    if (!plan) {
      throw new NotFoundException(`饲养计划 #${id} 不存在`);
    }
    return plan;
  }

  async update(id: number, dto: UpdateFeedingPlanDto): Promise<FeedingPlan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    const updated = await this.planRepository.save(plan);
    this.logger.log(`Updated feeding plan: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepository.remove(plan);
    this.logger.log(`Removed feeding plan: ${id}`);
  }

  async getPlansByDateRange(
    startDate: string,
    endDate: string,
    filters?: {
      status?: string;
      feeder?: string;
      targetType?: string;
    },
  ): Promise<FeedingPlan[]> {
    const where: any = {
      status: 'active',
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.feeder) where.feeder = filters.feeder;
    if (filters?.targetType) where.targetType = filters.targetType;

    const plans = await this.planRepository.find({
      where,
      relations: ['animal'],
      order: { feedTime: 'ASC' },
    });

    return plans.filter((plan) => {
      const planStart = dayjs(plan.startDate);
      const planEnd = plan.endDate ? dayjs(plan.endDate) : dayjs('2099-12-31');
      const rangeStart = dayjs(startDate);
      const rangeEnd = dayjs(endDate);
      return planStart.isBefore(rangeEnd) && planEnd.isAfter(rangeStart);
    });
  }

  async getTasksByDateRange(
    startDate: string,
    endDate: string,
    filters?: {
      status?: string;
      feeder?: string;
      animalId?: number;
      planId?: number;
    },
  ): Promise<FeedingTask[]> {
    const where: any = {
      taskDate: Between(startDate, endDate) as any,
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.feeder) where.feeder = filters.feeder;
    if (filters?.animalId) where.animalId = filters.animalId;
    if (filters?.planId) where.planId = filters.planId;

    return this.taskRepository.find({
      where,
      relations: ['animal', 'plan'],
      order: { taskDate: 'ASC', taskTime: 'ASC' },
    });
  }

  async getTask(id: number): Promise<FeedingTask> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['animal', 'plan', 'feedingRecord'],
    });
    if (!task) {
      throw new NotFoundException(`饲养任务 #${id} 不存在`);
    }
    return task;
  }

  async updateTask(id: number, data: any): Promise<FeedingTask> {
    const task = await this.getTask(id);
    Object.assign(task, data);
    return this.taskRepository.save(task);
  }

  async deleteTask(id: number): Promise<void> {
    const task = await this.getTask(id);
    await this.taskRepository.remove(task);
  }

  async completeTask(id: number, dto: CompleteFeedingTaskDto): Promise<FeedingTask> {
    const task = await this.getTask(id);

    if (task.status === 'cancelled') {
      throw new BadRequestException('已取消的任务无法完成');
    }
    if (task.status === 'completed') {
      throw new BadRequestException('任务已完成');
    }

    const recordData: any = {
      animalId: task.animalId,
      feedDate: dayjs(task.taskDate).format('YYYY-MM-DD'),
      feedTime: dto.actualFeedTime || task.taskTime,
      foodType: task.foodType,
      quantity: dto.actualQuantity ?? task.quantity,
      unit: task.unit,
      waterMl: dto.actualWaterMl ?? task.waterMl,
      feeder: dto.feeder || task.feeder,
      notes: dto.notes,
    };

    const record = this.feedingRecordRepository.create(recordData) as unknown as FeedingRecord;
    const savedRecord = await this.feedingRecordRepository.save(record);

    task.status = 'completed';
    task.feedingRecordId = savedRecord.id;
    task.completedAt = new Date();
    if (dto.notes) {
      task.notes = task.notes ? task.notes + '\n' + dto.notes : dto.notes;
    }

    const updated = await this.taskRepository.save(task);
    this.logger.log(`Completed feeding task: ${id}, created feeding record: ${savedRecord.id}`);

    return updated;
  }

  async cancelTask(id: number, notes?: string): Promise<FeedingTask> {
    const task = await this.getTask(id);

    if (task.status === 'completed') {
      throw new BadRequestException('已完成的任务无法取消');
    }
    if (task.status === 'cancelled') {
      throw new BadRequestException('任务已取消');
    }

    task.status = 'cancelled';
    if (notes) {
      task.notes = task.notes ? task.notes + '\n' + notes : notes;
    }
    const updated = await this.taskRepository.save(task);
    this.logger.log(`Cancelled feeding task: ${id}`);
    return updated;
  }

  async generateDailyTasks(date?: string): Promise<{ count: number; tasks: FeedingTask[] }> {
    const targetDate = date ? dayjs(date) : dayjs();
    const dateStr = targetDate.format('YYYY-MM-DD');
    const dayOfWeek = targetDate.day() === 0 ? 7 : targetDate.day();

    this.logger.log(`Generating feeding tasks for ${dateStr} (day ${dayOfWeek})`);

    const activePlans = await this.planRepository.find({
      where: { status: 'active' },
    });

    const validPlans = activePlans.filter((plan) => {
      const startDate = dayjs(plan.startDate);
      const endDate = plan.endDate ? dayjs(plan.endDate) : dayjs('2099-12-31');

      if (targetDate.isBefore(startDate, 'day') || targetDate.isAfter(endDate, 'day')) {
        return false;
      }

      if (plan.repeatType === 'daily') {
        return true;
      } else if (plan.repeatType === 'weekly') {
        if (!plan.repeatDays) return false;
        const days = plan.repeatDays.split(',').map(Number);
        return days.includes(dayOfWeek);
      } else if (plan.repeatType === 'cron') {
        return this.matchCron(plan.cronExpression, targetDate);
      }

      return false;
    });

    const tasks: FeedingTask[] = [];

    for (const plan of validPlans) {
      const animals = await this.getAnimalsForPlan(plan);

      for (const animal of animals) {
        const existingTask = await this.taskRepository.findOne({
          where: {
            planId: plan.id,
            animalId: animal.id,
            taskDate: dateStr as any,
          },
        });

        if (!existingTask) {
          const task = this.taskRepository.create({
            planId: plan.id,
            animalId: animal.id,
            taskDate: dateStr,
            taskTime: plan.feedTime,
            foodType: plan.foodType,
            quantity: plan.quantity,
            unit: plan.unit,
            waterMl: plan.waterMl,
            feeder: plan.feeder,
            status: 'pending',
            notes: plan.notes,
          });
          tasks.push(task);
        }
      }
    }

    if (tasks.length > 0) {
      const saved = await this.taskRepository.save(tasks);
      this.logger.log(`Generated ${saved.length} feeding tasks for ${dateStr}`);
      return { count: saved.length, tasks: saved };
    }

    this.logger.log(`No new feeding tasks generated for ${dateStr}`);
    return { count: 0, tasks: [] };
  }

  private async getAnimalsForPlan(plan: FeedingPlan): Promise<Animal[]> {
    if (plan.targetType === 'animal' && plan.animalId) {
      const animal = await this.animalRepository.findOne({ where: { id: plan.animalId } });
      return animal ? [animal] : [];
    } else if (plan.targetType === 'cage' && plan.cageNumber) {
      return this.animalRepository.find({ where: { cageNumber: plan.cageNumber } });
    }
    return [];
  }

  private matchCron(cronExpression: string | undefined, date: dayjs.Dayjs): boolean {
    if (!cronExpression) return false;

    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length < 5) return false;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const dateMinute = date.minute();
    const dateHour = date.hour();
    const dateDay = date.date();
    const dateMonth = date.month() + 1;
    const dateDow = date.day() === 0 ? 0 : date.day();

    const matchField = (value: number, field: string): boolean => {
      if (field === '*') return true;
      if (field.includes(',')) {
        return field.split(',').some((f) => matchField(value, f.trim()));
      }
      if (field.includes('/')) {
        const [range, step] = field.split('/');
        const stepNum = parseInt(step, 10);
        if (range === '*') return value % stepNum === 0;
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(Number);
          return value >= start && value <= end && (value - start) % stepNum === 0;
        }
        return false;
      }
      if (field.includes('-')) {
        const [start, end] = field.split('-').map(Number);
        return value >= start && value <= end;
      }
      return parseInt(field, 10) === value;
    };

    return (
      matchField(dateMinute, minute) &&
      matchField(dateHour, hour) &&
      matchField(dateDay, dayOfMonth) &&
      matchField(dateMonth, month) &&
      matchField(dateDow, dayOfWeek)
    );
  }

  async markMissedTasks(): Promise<number> {
    const today = dayjs().startOf('day').toDate();

    const tasksToUpdate = await this.taskRepository.find({
      where: {
        status: 'pending',
        taskDate: LessThanOrEqual(today) as any,
      },
    });

    if (tasksToUpdate.length === 0) {
      this.logger.log('No missed tasks to update');
      return 0;
    }

    for (const task of tasksToUpdate) {
      task.status = 'missed';
    }

    const updated = await this.taskRepository.save(tasksToUpdate);
    this.logger.log(`Marked ${updated.length} feeding tasks as missed`);
    return updated.length;
  }

  async getFeeders(): Promise<string[]> {
    const result = await this.planRepository
      .createQueryBuilder('fp')
      .select('DISTINCT fp.feeder', 'feeder')
      .where('fp.feeder IS NOT NULL')
      .andWhere('fp.feeder != :empty', { empty: '' })
      .orderBy('fp.feeder', 'ASC')
      .getRawMany();

    return result.map((r) => r.feeder).filter(Boolean);
  }

  async getFoodTypes(): Promise<string[]> {
    const result = await this.planRepository
      .createQueryBuilder('fp')
      .select('DISTINCT fp.food_type', 'foodType')
      .where('fp.food_type IS NOT NULL')
      .andWhere('fp.food_type != :empty', { empty: '' })
      .orderBy('fp.food_type', 'ASC')
      .getRawMany();

    return result.map((r) => r.foodType).filter(Boolean);
  }

  async getDailyStats(date: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    missed: number;
    cancelled: number;
  }> {
    const tasks = await this.taskRepository.find({
      where: { taskDate: dayjs(date).toDate() as any },
    });

    const stats = { total: tasks.length, pending: 0, completed: 0, missed: 0, cancelled: 0 };
    for (const t of tasks) {
      if (stats[t.status as keyof typeof stats] !== undefined) {
        stats[t.status as keyof typeof stats]++;
      }
    }

    return stats;
  }

  async getDailyStatsByDateRange(
    startDate: string,
    endDate: string,
    filters?: {
      feeder?: string;
      animalId?: number;
    },
  ): Promise<Array<{
    date: string;
    total: number;
    pending: number;
    completed: number;
    missed: number;
    cancelled: number;
    completionRate: number;
  }>> {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days: string[] = [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      days.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }

    const where: any = {
      taskDate: Between(startDate, endDate) as any,
    };

    if (filters?.feeder) {
      where.feeder = filters.feeder;
    }
    if (filters?.animalId) {
      where.animalId = filters.animalId;
    }

    const tasks = await this.taskRepository.find({ where });

    const statsMap: Record<string, {
      total: number;
      pending: number;
      completed: number;
      missed: number;
      cancelled: number;
    }> = {};

    for (const d of days) {
      statsMap[d] = { total: 0, pending: 0, completed: 0, missed: 0, cancelled: 0 };
    }

    for (const task of tasks) {
      const dateStr = dayjs(task.taskDate).format('YYYY-MM-DD');
      if (statsMap[dateStr]) {
        statsMap[dateStr].total++;
        if (task.status in statsMap[dateStr]) {
          (statsMap[dateStr] as any)[task.status]++;
        }
      }
    }

    const result = days.map((date) => {
      const s = statsMap[date];
      const completionRate = s.total > 0 ? Number(((s.completed / s.total) * 100).toFixed(1)) : 0;
      return {
        date,
        ...s,
        completionRate,
      };
    });

    return result;
  }
}
