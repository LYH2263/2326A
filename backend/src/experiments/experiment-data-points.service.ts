import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ExperimentDataPoint } from './entities/experiment-data-point.entity';
import { CreateExperimentDataPointDto, BatchCreateExperimentDataPointDto } from './dto/create-experiment-data-point.dto';
import { UpdateExperimentDataPointDto } from './dto/update-experiment-data-point.dto';

@Injectable()
export class ExperimentDataPointsService {
  private readonly logger = new Logger(ExperimentDataPointsService.name);

  constructor(
    @InjectRepository(ExperimentDataPoint)
    private readonly dataPointRepository: Repository<ExperimentDataPoint>,
  ) {}

  async create(dto: CreateExperimentDataPointDto): Promise<ExperimentDataPoint> {
    const point = this.dataPointRepository.create({
      ...dto,
      collectedAt: new Date(dto.collectedAt),
    });
    const saved = await this.dataPointRepository.save(point);
    this.logger.log(`Created data point: ${saved.id} for experiment ${saved.experimentId}`);
    return saved;
  }

  async batchCreate(dto: BatchCreateExperimentDataPointDto): Promise<ExperimentDataPoint[]> {
    const points = dto.points.map(p =>
      this.dataPointRepository.create({
        ...p,
        collectedAt: new Date(p.collectedAt),
      }),
    );
    const saved = await this.dataPointRepository.save(points);
    this.logger.log(`Batch created ${saved.length} data points`);
    return saved;
  }

  async findAll(query: {
    experimentId?: number;
    animalId?: number;
    metricName?: string;
    dataType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ list: ExperimentDataPoint[]; total: number }> {
    const {
      experimentId,
      animalId,
      metricName,
      dataType,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    const where: any = {};
    if (experimentId) where.experimentId = experimentId;
    if (animalId) where.animalId = animalId;
    if (metricName) where.metricName = metricName;
    if (dataType) where.dataType = dataType;
    if (startDate && endDate) {
      where.collectedAt = Between(new Date(startDate), new Date(endDate));
    }

    const [list, total] = await this.dataPointRepository.findAndCount({
      where,
      relations: ['animal'],
      order: { collectedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<ExperimentDataPoint> {
    const point = await this.dataPointRepository.findOne({
      where: { id },
      relations: ['experiment', 'animal'],
    });
    if (!point) {
      throw new NotFoundException(`数据点 #${id} 不存在`);
    }
    return point;
  }

  async update(id: number, dto: UpdateExperimentDataPointDto): Promise<ExperimentDataPoint> {
    const point = await this.findOne(id);
    const updateData: any = { ...dto };
    if (dto.collectedAt) {
      updateData.collectedAt = new Date(dto.collectedAt);
    }
    Object.assign(point, updateData);
    const updated = await this.dataPointRepository.save(point);
    this.logger.log(`Updated data point: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const point = await this.findOne(id);
    await this.dataPointRepository.remove(point);
    this.logger.log(`Removed data point: ${id}`);
  }

  async getMetricNames(experimentId: number): Promise<string[]> {
    const result = await this.dataPointRepository
      .createQueryBuilder('dp')
      .select('DISTINCT dp.metric_name', 'metricName')
      .where('dp.experiment_id = :experimentId', { experimentId })
      .orderBy('dp.metric_name', 'ASC')
      .getRawMany();
    return result.map((r: any) => r.metricName);
  }

  async getStatistics(query: {
    experimentId: number;
    metricName: string;
    groupBy?: 'animal' | 'day' | 'week';
    startDate?: string;
    endDate?: string;
    animalIds?: number[];
  }): Promise<any[]> {
    const { experimentId, metricName, groupBy = 'animal', startDate, endDate, animalIds } = query;

    let qb = this.dataPointRepository
      .createQueryBuilder('dp')
      .where('dp.experiment_id = :experimentId', { experimentId })
      .andWhere('dp.metric_name = :metricName', { metricName })
      .andWhere('dp.data_type = :dataType', { dataType: 'numeric' });

    if (startDate) {
      qb = qb.andWhere('dp.collected_at >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb = qb.andWhere('dp.collected_at <= :endDate', { endDate: new Date(endDate) });
    }
    if (animalIds && animalIds.length > 0) {
      qb = qb.andWhere('dp.animal_id IN (:...animalIds)', { animalIds });
    }

    if (groupBy === 'animal') {
      qb = qb
        .select('dp.animal_id', 'animalId')
        .addSelect('a.name', 'animalName')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(dp.numeric_value)', 'avgValue')
        .addSelect('MIN(dp.numeric_value)', 'minValue')
        .addSelect('MAX(dp.numeric_value)', 'maxValue')
        .addSelect('STDDEV(dp.numeric_value)', 'stdValue')
        .leftJoin('dp.animal', 'a')
        .groupBy('dp.animal_id')
        .addGroupBy('a.name')
        .orderBy('dp.animal_id', 'ASC');
    } else if (groupBy === 'day') {
      qb = qb
        .select('DATE(dp.collected_at)', 'date')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(dp.numeric_value)', 'avgValue')
        .addSelect('MIN(dp.numeric_value)', 'minValue')
        .addSelect('MAX(dp.numeric_value)', 'maxValue')
        .addSelect('STDDEV(dp.numeric_value)', 'stdValue')
        .groupBy('DATE(dp.collected_at)')
        .orderBy('DATE(dp.collected_at)', 'ASC');
    } else if (groupBy === 'week') {
      qb = qb
        .select('YEARWEEK(dp.collected_at, 1)', 'week')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(dp.numeric_value)', 'avgValue')
        .addSelect('MIN(dp.numeric_value)', 'minValue')
        .addSelect('MAX(dp.numeric_value)', 'maxValue')
        .addSelect('STDDEV(dp.numeric_value)', 'stdValue')
        .groupBy('YEARWEEK(dp.collected_at, 1)')
        .orderBy('YEARWEEK(dp.collected_at, 1)', 'ASC');
    }

    return qb.getRawMany();
  }

  async getTimeSeries(query: {
    experimentId: number;
    metricName: string;
    animalIds?: number[];
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const { experimentId, metricName, animalIds, startDate, endDate } = query;

    let qb = this.dataPointRepository
      .createQueryBuilder('dp')
      .select('dp.animal_id', 'animalId')
      .addSelect('a.name', 'animalName')
      .addSelect('dp.collected_at', 'collectedAt')
      .addSelect('dp.numeric_value', 'value')
      .addSelect('dp.unit', 'unit')
      .leftJoin('dp.animal', 'a')
      .where('dp.experiment_id = :experimentId', { experimentId })
      .andWhere('dp.metric_name = :metricName', { metricName })
      .andWhere('dp.data_type = :dataType', { dataType: 'numeric' });

    if (animalIds && animalIds.length > 0) {
      qb = qb.andWhere('dp.animal_id IN (:...animalIds)', { animalIds });
    }
    if (startDate) {
      qb = qb.andWhere('dp.collected_at >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb = qb.andWhere('dp.collected_at <= :endDate', { endDate: new Date(endDate) });
    }

    qb = qb.orderBy('dp.collected_at', 'ASC').addOrderBy('dp.animal_id', 'ASC');

    return qb.getRawMany();
  }
}
