import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthRecord } from './entities/health-record.entity';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectRepository(HealthRecord)
    private readonly healthRecordRepository: Repository<HealthRecord>,
  ) {}

  async create(dto: CreateHealthRecordDto): Promise<HealthRecord> {
    const record = this.healthRecordRepository.create(dto);
    const saved = await this.healthRecordRepository.save(record);
    this.logger.log(`Created health record: ${saved.id} for animal ${saved.animalId}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    animalId?: number;
    condition?: string;
  }): Promise<{ list: HealthRecord[]; total: number }> {
    const { page = 1, pageSize = 10, animalId, condition } = query;
    const where: any = {};

    if (animalId) where.animalId = animalId;
    if (condition) where.condition = condition;

    const [list, total] = await this.healthRecordRepository.findAndCount({
      where,
      relations: ['animal'],
      order: { checkDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<HealthRecord> {
    const record = await this.healthRecordRepository.findOne({
      where: { id },
      relations: ['animal'],
    });
    if (!record) {
      throw new NotFoundException(`健康记录 #${id} 不存在`);
    }
    return record;
  }

  async update(id: number, dto: UpdateHealthRecordDto): Promise<HealthRecord> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    const updated = await this.healthRecordRepository.save(record);
    this.logger.log(`Updated health record: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.healthRecordRepository.remove(record);
    this.logger.log(`Removed health record: ${id}`);
  }

  async countByCondition(): Promise<{ condition: string; count: number }[]> {
    return this.healthRecordRepository
      .createQueryBuilder('hr')
      .select('hr.condition', 'condition')
      .addSelect('COUNT(*)', 'count')
      .groupBy('hr.condition')
      .getRawMany();
  }
}
