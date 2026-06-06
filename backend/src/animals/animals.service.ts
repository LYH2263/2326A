import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Animal } from './entities/animal.entity';
import { CageTransferLog } from './entities/cage-transfer-log.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CageSplitDto, CageMergeDto, CageTransferLogQueryDto } from './dto/cage-transfer.dto';

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(CageTransferLog)
    private readonly cageTransferLogRepository: Repository<CageTransferLog>,
  ) {}

  async create(createAnimalDto: CreateAnimalDto): Promise<Animal> {
    const animal = this.animalRepository.create(createAnimalDto);
    const saved = await this.animalRepository.save(animal);
    this.logger.log(`Created animal: ${saved.id} - ${saved.name}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    species?: string;
    status?: string;
    keyword?: string;
  }): Promise<{ list: Animal[]; total: number }> {
    const { page = 1, pageSize = 10, species, status, keyword } = query;
    const where: any = {};

    if (species) where.species = species;
    if (status) where.status = status;
    if (keyword) where.name = Like(`%${keyword}%`);

    const [list, total] = await this.animalRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<Animal> {
    const animal = await this.animalRepository.findOne({
      where: { id },
      relations: ['healthRecords', 'feedingRecords', 'experimentAnimals'],
    });
    if (!animal) {
      throw new NotFoundException(`动物 #${id} 不存在`);
    }
    return animal;
  }

  async update(id: number, updateAnimalDto: UpdateAnimalDto): Promise<Animal> {
    const animal = await this.findOne(id);
    Object.assign(animal, updateAnimalDto);
    const updated = await this.animalRepository.save(animal);
    this.logger.log(`Updated animal: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const animal = await this.findOne(id);
    await this.animalRepository.remove(animal);
    this.logger.log(`Removed animal: ${id}`);
  }

  async getSpeciesList(): Promise<string[]> {
    const result = await this.animalRepository
      .createQueryBuilder('animal')
      .select('DISTINCT animal.species', 'species')
      .getRawMany();
    return result.map((r) => r.species);
  }

  async count(): Promise<number> {
    return this.animalRepository.count();
  }

  async countByStatus(): Promise<{ status: string; count: number }[]> {
    return this.animalRepository
      .createQueryBuilder('animal')
      .select('animal.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('animal.status')
      .getRawMany();
  }

  async countBySpecies(): Promise<{ species: string; count: number }[]> {
    return this.animalRepository
      .createQueryBuilder('animal')
      .select('animal.species', 'species')
      .addSelect('COUNT(*)', 'count')
      .groupBy('animal.species')
      .getRawMany();
  }

  async cageSplit(dto: CageSplitDto, operator?: string): Promise<{ success: boolean; count: number; sourceCageEmpty: boolean; sourceCage: string }> {
    const { animalIds, targetCage, reason } = dto;

    if (!animalIds || animalIds.length === 0) {
      throw new BadRequestException('请选择要分笼的动物');
    }

    const animals = await this.animalRepository.find({
      where: { id: In(animalIds) },
    });

    if (animals.length === 0) {
      throw new NotFoundException('未找到选中的动物');
    }

    const sourceCages = [...new Set(animals.map((a) => a.cageNumber).filter(Boolean))];
    if (sourceCages.length === 0) {
      throw new BadRequestException('选中的动物没有笼号，无法分笼');
    }
    if (sourceCages.length > 1) {
      throw new BadRequestException('分笼操作请选择同一笼位的动物');
    }

    const sourceCage = sourceCages[0];

    await this.animalRepository.manager.transaction(async (manager) => {
      const logs: CageTransferLog[] = [];

      for (const animal of animals) {
        const fromCage = animal.cageNumber;
        animal.cageNumber = targetCage;
        await manager.save(animal);

        const log = this.cageTransferLogRepository.create({
          animalId: animal.id,
          fromCage,
          toCage: targetCage,
          operationType: 'cage_split',
          reason,
          operator,
        });
        logs.push(log);
      }

      await manager.save(logs);
    });

    const remainingCount = await this.animalRepository.count({
      where: { cageNumber: sourceCage },
    });
    const sourceCageEmpty = remainingCount === 0;

    this.logger.log(`Cage split: ${animalIds.length} animals moved from ${sourceCage} to ${targetCage}. Source cage empty: ${sourceCageEmpty}`);

    return { success: true, count: animals.length, sourceCageEmpty, sourceCage };
  }

  async cageMerge(dto: CageMergeDto, operator?: string): Promise<{ 
    success: boolean; 
    count: number; 
    warnings: string[];
    emptyCages?: string[];
  }> {
    const { animalIds, targetCage, reason, confirmSpeciesMixed } = dto;
    const warnings: string[] = [];

    if (!animalIds || animalIds.length === 0) {
      throw new BadRequestException('请选择要合笼的动物');
    }

    const animals = await this.animalRepository.find({
      where: { id: In(animalIds) },
    });

    if (animals.length === 0) {
      throw new NotFoundException('未找到选中的动物');
    }

    const speciesSet = new Set(animals.map((a) => a.species));
    if (speciesSet.size > 1 && !confirmSpeciesMixed) {
      warnings.push(`合笼动物包含不同物种：${Array.from(speciesSet).join('、')}，请确认是否继续`);
      return { success: false, count: 0, warnings };
    }

    const sourceCages = [...new Set(animals.map((a) => a.cageNumber).filter(Boolean))];
    if (sourceCages.length <= 1 && sourceCages[0] === targetCage) {
      warnings.push('选中的动物都在目标笼中，无需合笼');
      return { success: false, count: 0, warnings };
    }

    const emptyCages: string[] = [];

    await this.animalRepository.manager.transaction(async (manager) => {
      const logs: CageTransferLog[] = [];

      for (const animal of animals) {
        const fromCage = animal.cageNumber;
        animal.cageNumber = targetCage;
        await manager.save(animal);

        const log = this.cageTransferLogRepository.create({
          animalId: animal.id,
          fromCage,
          toCage: targetCage,
          operationType: 'cage_merge',
          reason,
          operator,
        });
        logs.push(log);
      }

      await manager.save(logs);
    });

    for (const cage of sourceCages) {
      if (cage === targetCage) continue;
      const remainingCount = await this.animalRepository.count({
        where: { cageNumber: cage },
      });
      if (remainingCount === 0) {
        emptyCages.push(cage);
      }
    }

    this.logger.log(`Cage merge: ${animalIds.length} animals merged into ${targetCage}. Empty cages: ${emptyCages.join(', ')}`);

    return { success: true, count: animals.length, warnings, emptyCages };
  }

  async getTransferLogs(query: CageTransferLogQueryDto): Promise<{ list: CageTransferLog[]; total: number }> {
    const { animalId, cageNumber, operationType, page = 1, pageSize = 10 } = query;
    const where: any = {};

    if (animalId) {
      where.animalId = animalId;
    }

    if (operationType) {
      where.operationType = operationType;
    }

    const qb = this.cageTransferLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.animal', 'animal')
      .where(where);

    if (cageNumber) {
      qb.andWhere('(log.fromCage = :cage OR log.toCage = :cage)', { cage: cageNumber });
    }

    qb.orderBy('log.operatedAt', 'DESC');

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total };
  }

  async getTransferLogsByAnimal(animalId: number): Promise<CageTransferLog[]> {
    return this.cageTransferLogRepository.find({
      where: { animalId },
      order: { operatedAt: 'DESC' },
    });
  }
}
