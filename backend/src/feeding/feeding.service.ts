import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedingRecord } from './entities/feeding-record.entity';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { UpdateFeedingRecordDto } from './dto/update-feeding-record.dto';

@Injectable()
export class FeedingService {
  private readonly logger = new Logger(FeedingService.name);

  constructor(
    @InjectRepository(FeedingRecord)
    private readonly feedingRecordRepository: Repository<FeedingRecord>,
  ) {}

  async create(dto: CreateFeedingRecordDto): Promise<FeedingRecord> {
    const record = this.feedingRecordRepository.create(dto);
    const saved = await this.feedingRecordRepository.save(record);
    this.logger.log(`Created feeding record: ${saved.id} for animal ${saved.animalId}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    animalId?: number;
    feedDate?: string;
  }): Promise<{ list: FeedingRecord[]; total: number }> {
    const { page = 1, pageSize = 10, animalId, feedDate } = query;
    const where: any = {};

    if (animalId) where.animalId = animalId;
    if (feedDate) where.feedDate = feedDate;

    const [list, total] = await this.feedingRecordRepository.findAndCount({
      where,
      relations: ['animal'],
      order: { feedDate: 'DESC', feedTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<FeedingRecord> {
    const record = await this.feedingRecordRepository.findOne({
      where: { id },
      relations: ['animal'],
    });
    if (!record) {
      throw new NotFoundException(`饲养记录 #${id} 不存在`);
    }
    return record;
  }

  async update(id: number, dto: UpdateFeedingRecordDto): Promise<FeedingRecord> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    const updated = await this.feedingRecordRepository.save(record);
    this.logger.log(`Updated feeding record: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.feedingRecordRepository.remove(record);
    this.logger.log(`Removed feeding record: ${id}`);
  }

  async getDailyFeedingSummary(): Promise<any[]> {
    return this.feedingRecordRepository
      .createQueryBuilder('fr')
      .select('fr.feed_date', 'feedDate')
      .addSelect('COUNT(*)', 'totalRecords')
      .addSelect('COUNT(DISTINCT fr.animal_id)', 'animalCount')
      .groupBy('fr.feed_date')
      .orderBy('fr.feed_date', 'DESC')
      .limit(30)
      .getRawMany();
  }
}
