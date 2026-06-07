import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HealthRecord } from './entities/health-record.entity';
import { SpeciesNormalRange } from './entities/species-normal-range.entity';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';
import { Animal } from '../animals/entities/animal.entity';

interface IndicatorAnomaly {
  value: number | null;
  isAbnormal: boolean;
  min: number | null;
  max: number | null;
  status: 'normal' | 'below' | 'above' | 'unknown';
}

interface TrendIndicatorData {
  checkDate: string;
  temperature: number | null;
  weight: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectRepository(HealthRecord)
    private readonly healthRecordRepository: Repository<HealthRecord>,
    @InjectRepository(SpeciesNormalRange)
    private readonly normalRangeRepository: Repository<SpeciesNormalRange>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
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

  async getNormalRanges(species?: string): Promise<SpeciesNormalRange[]> {
    const where: any = {};
    if (species) where.species = species;
    return this.normalRangeRepository.find({
      where,
      order: { species: 'ASC', indicatorName: 'ASC' },
    });
  }

  private async getNormalRangesMap(species: string): Promise<Map<string, { min: number; max: number }>> {
    const ranges = await this.normalRangeRepository.find({ where: { species } });
    const map = new Map<string, { min: number; max: number }>();
    ranges.forEach((r) => {
      map.set(r.indicatorName, { min: Number(r.minValue), max: Number(r.maxValue) });
    });
    return map;
  }

  private checkAnomaly(value: number | null, range: { min: number; max: number } | undefined): IndicatorAnomaly {
    if (value === null || value === undefined) {
      return { value: null, isAbnormal: false, min: null, max: null, status: 'unknown' };
    }
    if (!range) {
      return { value, isAbnormal: false, min: null, max: null, status: 'unknown' };
    }
    if (value < range.min) {
      return { value, isAbnormal: true, min: range.min, max: range.max, status: 'below' };
    }
    if (value > range.max) {
      return { value, isAbnormal: true, min: range.min, max: range.max, status: 'above' };
    }
    return { value, isAbnormal: false, min: range.min, max: range.max, status: 'normal' };
  }

  async getAnimalTrend(animalId: number, limit: number = 10): Promise<any> {
    if (limit < 2) limit = 2;
    if (limit > 50) limit = 50;

    const animal = await this.animalRepository.findOne({ where: { id: animalId } });
    if (!animal) {
      throw new NotFoundException(`动物 #${animalId} 不存在`);
    }

    const records = await this.healthRecordRepository.find({
      where: { animalId },
      order: { checkDate: 'DESC' },
      take: limit,
    });

    if (records.length === 0) {
      return {
        animal: { id: animal.id, name: animal.name, species: animal.species },
        records: [],
        latest: null,
        average: null,
        normalRanges: {},
        anomalies: {},
      };
    }

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.checkDate).getTime() - new Date(b.checkDate).getTime(),
    );

    const normalRangesMap = await this.getNormalRangesMap(animal.species);

    const trendData: TrendIndicatorData[] = sortedRecords.map((r) => ({
      checkDate: r.checkDate instanceof Date ? r.checkDate.toISOString().split('T')[0] : String(r.checkDate),
      temperature: r.temperature !== null && r.temperature !== undefined ? Number(r.temperature) : null,
      weight: r.weight !== null && r.weight !== undefined ? Number(r.weight) : null,
      heartRate: r.heartRate !== null && r.heartRate !== undefined ? Number(r.heartRate) : null,
      respiratoryRate:
        r.respiratoryRate !== null && r.respiratoryRate !== undefined ? Number(r.respiratoryRate) : null,
    }));

    const latest = trendData[trendData.length - 1];

    const calcAvg = (key: keyof TrendIndicatorData): number | null => {
      const values = trendData
        .map((d) => d[key] as number | null)
        .filter((v): v is number => v !== null && v !== undefined);
      if (values.length === 0) return null;
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const average = {
      temperature: calcAvg('temperature'),
      weight: calcAvg('weight'),
      heartRate: calcAvg('heartRate'),
      respiratoryRate: calcAvg('respiratoryRate'),
    };

    const indicatorMap: Record<string, string> = {
      temperature: 'temperature',
      weight: 'weight',
      heartRate: 'heartRate',
      respiratoryRate: 'respiratoryRate',
    };

    const anomalies: Record<string, IndicatorAnomaly> = {};
    Object.keys(indicatorMap).forEach((key) => {
      const rangeKey = indicatorMap[key];
      const range = normalRangesMap.get(rangeKey);
      const val = (latest as any)[key] as number | null;
      anomalies[key] = this.checkAnomaly(val, range);
    });

    const normalRanges: Record<string, { min: number | null; max: number | null; unit?: string }> = {};
    Object.keys(indicatorMap).forEach((key) => {
      const range = normalRangesMap.get(indicatorMap[key]);
      normalRanges[key] = {
        min: range ? range.min : null,
        max: range ? range.max : null,
      };
    });

    return {
      animal: { id: animal.id, name: animal.name, species: animal.species },
      records: trendData,
      latest,
      average,
      normalRanges,
      anomalies,
    };
  }

  async getMultiAnimalComparison(animalIds: number[], startDate?: string, endDate?: string): Promise<any> {
    if (!animalIds || animalIds.length === 0) {
      throw new BadRequestException('请选择至少一只动物');
    }
    if (animalIds.length > 5) {
      throw new BadRequestException('最多支持5只动物对比');
    }

    const animals = await this.animalRepository.find({
      where: { id: In(animalIds) },
    });

    if (animals.length === 0) {
      throw new NotFoundException('未找到指定动物');
    }

    const speciesSet = new Set(animals.map((a) => a.species));
    const speciesList = Array.from(speciesSet);

    const normalRangesBySpecies: Record<string, Map<string, { min: number; max: number }>> = {};
    for (const species of speciesList) {
      normalRangesBySpecies[species] = await this.getNormalRangesMap(species);
    }

    const comparisonData: any[] = [];
    const indicators = ['temperature', 'weight', 'heartRate', 'respiratoryRate'];

    for (const animal of animals) {
      const qb = this.healthRecordRepository
        .createQueryBuilder('hr')
        .where('hr.animal_id = :animalId', { animalId: animal.id })
        .orderBy('hr.check_date', 'ASC');

      if (startDate) {
        qb.andWhere('hr.check_date >= :startDate', { startDate });
      }
      if (endDate) {
        qb.andWhere('hr.check_date <= :endDate', { endDate });
      }

      const records = await qb.getMany();

      if (records.length > 0) {
        const rangeMap = normalRangesBySpecies[animal.species];

        const avgValues: Record<string, number | null> = {};
        indicators.forEach((ind) => {
          const validVals = records
            .map((r) => (r as any)[ind])
            .filter((v) => v !== null && v !== undefined)
            .map((v) => Number(v));
          if (validVals.length > 0) {
            avgValues[ind] = validVals.reduce((a, b) => a + b, 0) / validVals.length;
          } else {
            avgValues[ind] = null;
          }
        });

        const anomalyInfo: Record<string, IndicatorAnomaly> = {};
        indicators.forEach((ind) => {
          const range = rangeMap.get(ind);
          anomalyInfo[ind] = this.checkAnomaly(avgValues[ind], range);
        });

        const firstRecord = records[0];
        const lastRecord = records[records.length - 1];

        comparisonData.push({
          animal: {
            id: animal.id,
            name: animal.name,
            species: animal.species,
          },
          recordCount: records.length,
          startDate:
            firstRecord.checkDate instanceof Date
              ? firstRecord.checkDate.toISOString().split('T')[0]
              : String(firstRecord.checkDate),
          endDate:
            lastRecord.checkDate instanceof Date
              ? lastRecord.checkDate.toISOString().split('T')[0]
              : String(lastRecord.checkDate),
          temperature: avgValues.temperature,
          weight: avgValues.weight,
          heartRate: avgValues.heartRate,
          respiratoryRate: avgValues.respiratoryRate,
          anomalies: anomalyInfo,
        });
      } else {
        comparisonData.push({
          animal: {
            id: animal.id,
            name: animal.name,
            species: animal.species,
          },
          recordCount: 0,
          startDate: null,
          endDate: null,
          temperature: null,
          weight: null,
          heartRate: null,
          respiratoryRate: null,
          anomalies: {
            temperature: { value: null, isAbnormal: false, min: null, max: null, status: 'unknown' },
            weight: { value: null, isAbnormal: false, min: null, max: null, status: 'unknown' },
            heartRate: { value: null, isAbnormal: false, min: null, max: null, status: 'unknown' },
            respiratoryRate: { value: null, isAbnormal: false, min: null, max: null, status: 'unknown' },
          },
        });
      }
    }

    const allSpeciesRanges: Record<string, Record<string, { min: number | null; max: number | null }>> = {};
    for (const species of speciesList) {
      const rangeMap = normalRangesBySpecies[species];
      allSpeciesRanges[species] = {};
      indicators.forEach((ind) => {
        const r = rangeMap.get(ind);
        allSpeciesRanges[species][ind] = {
          min: r ? r.min : null,
          max: r ? r.max : null,
        };
      });
    }

    return {
      animals: comparisonData,
      normalRanges: allSpeciesRanges,
      indicators,
      isAverage: true,
    };
  }
}
