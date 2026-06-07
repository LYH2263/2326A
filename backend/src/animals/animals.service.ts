import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Animal } from './entities/animal.entity';
import { CageTransferLog } from './entities/cage-transfer-log.entity';
import { StatusChangeLog } from './entities/status-change-log.entity';
import { BreedingRecord } from './entities/breeding-record.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CageSplitDto, CageMergeDto, CageTransferLogQueryDto } from './dto/cage-transfer.dto';
import { SetParentsDto } from './dto/set-parents.dto';
import { CreateBreedingRecordDto } from './dto/create-breeding-record.dto';
import { UpdateBreedingRecordDto } from './dto/update-breeding-record.dto';
import {
  isStatusTransitionAllowed,
  getAllowedNextStatuses,
  getStatusFlowEdges,
  STATUS_LABELS,
  StatusFlowEdge,
} from './status-flow';

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(CageTransferLog)
    private readonly cageTransferLogRepository: Repository<CageTransferLog>,
    @InjectRepository(StatusChangeLog)
    private readonly statusChangeLogRepository: Repository<StatusChangeLog>,
    @InjectRepository(BreedingRecord)
    private readonly breedingRecordRepository: Repository<BreedingRecord>,
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

  async update(
    id: number,
    updateAnimalDto: UpdateAnimalDto,
    operator?: string,
  ): Promise<Animal> {
    const animal = await this.findOne(id);
    const oldStatus = animal.status;
    const newStatus = updateAnimalDto.status;

    if (newStatus && newStatus !== oldStatus) {
      if (!isStatusTransitionAllowed(oldStatus, newStatus)) {
        const allowed = getAllowedNextStatuses(oldStatus);
        const allowedLabels = allowed.map((s) => STATUS_LABELS[s] || s).join('、');
        throw new BadRequestException(
          `状态转换不合法：${STATUS_LABELS[oldStatus] || oldStatus} 不能转换为 ${STATUS_LABELS[newStatus] || newStatus}。合法的目标状态：${allowedLabels || '无'}`,
        );
      }

      if (!updateAnimalDto.statusChangeReason?.trim()) {
        throw new BadRequestException('状态变更时必须填写变更原因');
      }
    }

    Object.assign(animal, updateAnimalDto);
    const updated = await this.animalRepository.save(animal);

    if (newStatus && newStatus !== oldStatus) {
      const log = this.statusChangeLogRepository.create({
        animalId: id,
        fromStatus: oldStatus,
        toStatus: newStatus,
        reason: updateAnimalDto.statusChangeReason,
        operator,
        experimentId: updateAnimalDto.experimentId,
      });
      await this.statusChangeLogRepository.save(log);
      this.logger.log(
        `Status changed for animal #${id}: ${oldStatus} -> ${newStatus} by ${operator || 'unknown'}`,
      );
    }

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

  getStatusFlowRules(): StatusFlowEdge[] {
    return getStatusFlowEdges();
  }

  async getStatusChangeLogs(animalId: number): Promise<StatusChangeLog[]> {
    return this.statusChangeLogRepository.find({
      where: { animalId },
      order: { changedAt: 'DESC' },
    });
  }

  async setParents(id: number, dto: SetParentsDto): Promise<Animal> {
    const animal = await this.findOne(id);

    if (dto.fatherId !== undefined) {
      if (dto.fatherId !== null && dto.fatherId === id) {
        throw new BadRequestException('父亲不能是自己');
      }
      if (dto.fatherId !== null) {
        const father = await this.animalRepository.findOne({ where: { id: dto.fatherId } });
        if (!father) {
          throw new NotFoundException(`父亲动物 #${dto.fatherId} 不存在`);
        }
        if (father.gender !== 'male') {
          throw new BadRequestException('父亲必须是雄性动物');
        }
      }
      animal.fatherId = dto.fatherId || null;
    }

    if (dto.motherId !== undefined) {
      if (dto.motherId !== null && dto.motherId === id) {
        throw new BadRequestException('母亲不能是自己');
      }
      if (dto.motherId !== null) {
        const mother = await this.animalRepository.findOne({ where: { id: dto.motherId } });
        if (!mother) {
          throw new NotFoundException(`母亲动物 #${dto.motherId} 不存在`);
        }
        if (mother.gender !== 'female') {
          throw new BadRequestException('母亲必须是雌性动物');
        }
      }
      animal.motherId = dto.motherId || null;
    }

    return this.animalRepository.save(animal);
  }

  async getParents(id: number): Promise<{ father?: Animal; mother?: Animal }> {
    const animal = await this.animalRepository.findOne({
      where: { id },
      relations: ['father', 'mother'],
    });
    if (!animal) {
      throw new NotFoundException(`动物 #${id} 不存在`);
    }
    return { father: animal.father, mother: animal.mother };
  }

  private toTreeNode(animal: Animal, parentType?: 'father' | 'mother' | 'child'): any {
    return {
      id: animal.id,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      gender: animal.gender,
      status: animal.status,
      birthDate: animal.birthDate,
      cageNumber: animal.cageNumber,
      parentType,
    };
  }

  async getAncestorsTree(id: number, generations: number = 3): Promise<any> {
    if (generations <= 0) {
      throw new BadRequestException('代数必须大于0');
    }
    const animal = await this.findOne(id);
    const visited = new Set<number>();
    visited.add(id);

    const buildTree = async (animalId: number, depth: number, visitedSet: Set<number>): Promise<any> => {
      const current = await this.animalRepository.findOne({
        where: { id: animalId },
        relations: ['father', 'mother'],
      });
      if (!current) return null;

      const node = this.toTreeNode(current);
      node.generation = depth;

      if (depth < generations) {
        if (current.father && !visitedSet.has(current.father.id)) {
          const fatherVisited = new Set(visitedSet);
          fatherVisited.add(current.father.id);
          node.father = await buildTree(current.father.id, depth + 1, fatherVisited);
        } else if (current.father && visitedSet.has(current.father.id)) {
          node.father = { ...this.toTreeNode(current.father, 'father'), loopDetected: true };
        }

        if (current.mother && !visitedSet.has(current.mother.id)) {
          const motherVisited = new Set(visitedSet);
          motherVisited.add(current.mother.id);
          node.mother = await buildTree(current.mother.id, depth + 1, motherVisited);
        } else if (current.mother && visitedSet.has(current.mother.id)) {
          node.mother = { ...this.toTreeNode(current.mother, 'mother'), loopDetected: true };
        }
      }

      return node;
    };

    const tree = await buildTree(id, 0, visited);
    return { root: tree, generations };
  }

  async getDescendantsTree(id: number, generations: number = 3): Promise<any> {
    if (generations <= 0) {
      throw new BadRequestException('代数必须大于0');
    }
    const animal = await this.findOne(id);
    const visited = new Set<number>();
    visited.add(id);

    const buildTree = async (animalId: number, depth: number, visitedSet: Set<number>): Promise<any> => {
      const current = await this.animalRepository.findOne({
        where: { id: animalId },
        relations: ['childrenAsFather', 'childrenAsMother'],
      });
      if (!current) return null;

      const node = this.toTreeNode(current);
      node.generation = depth;
      node.children = [];

      if (depth < generations) {
        const allChildren = [
          ...(current.childrenAsFather || []),
          ...(current.childrenAsMother || []),
        ];
        const uniqueChildren = Array.from(new Map(allChildren.map(c => [c.id, c])).values());

        for (const child of uniqueChildren) {
          if (!visitedSet.has(child.id)) {
            const childVisited = new Set(visitedSet);
            childVisited.add(child.id);
            const childNode = await buildTree(child.id, depth + 1, childVisited);
            if (childNode) {
              childNode.parentType = current.gender === 'male' ? 'father' : 'mother';
              node.children.push(childNode);
            }
          } else {
            node.children.push({ ...this.toTreeNode(child, current.gender === 'male' ? 'father' : 'mother'), loopDetected: true });
          }
        }
      }

      return node;
    };

    const tree = await buildTree(id, 0, visited);
    return { root: tree, generations };
  }

  async getFullPedigree(id: number, generations: number = 3): Promise<any> {
    const [ancestors, descendants] = await Promise.all([
      this.getAncestorsTree(id, generations),
      this.getDescendantsTree(id, generations),
    ]);
    return {
      animal: ancestors.root,
      ancestors: ancestors.root,
      descendants: descendants.root?.children || [],
      generations,
    };
  }

  async getChildren(id: number): Promise<Animal[]> {
    const animal = await this.animalRepository.findOne({
      where: { id },
      relations: ['childrenAsFather', 'childrenAsMother'],
    });
    if (!animal) {
      throw new NotFoundException(`动物 #${id} 不存在`);
    }
    const allChildren = [
      ...(animal.childrenAsFather || []),
      ...(animal.childrenAsMother || []),
    ];
    return Array.from(new Map(allChildren.map(c => [c.id, c])).values());
  }

  async createBreedingRecord(dto: CreateBreedingRecordDto, operator?: string): Promise<BreedingRecord> {
    const male = await this.animalRepository.findOne({ where: { id: dto.maleId } });
    if (!male) {
      throw new NotFoundException(`雄性动物 #${dto.maleId} 不存在`);
    }
    if (male.gender !== 'male') {
      throw new BadRequestException('雄性动物必须是雄性');
    }

    const female = await this.animalRepository.findOne({ where: { id: dto.femaleId } });
    if (!female) {
      throw new NotFoundException(`雌性动物 #${dto.femaleId} 不存在`);
    }
    if (female.gender !== 'female') {
      throw new BadRequestException('雌性动物必须是雌性');
    }

    if (male.species !== female.species) {
      throw new BadRequestException('繁殖的两只动物必须是同一物种');
    }

    const record = this.breedingRecordRepository.create({
      ...dto,
      operator,
    });
    const saved = await this.breedingRecordRepository.save(record);
    this.logger.log(`Created breeding record: ${saved.id} (male #${dto.maleId} x female #${dto.femaleId})`);
    return saved;
  }

  async updateBreedingRecord(id: number, dto: UpdateBreedingRecordDto, operator?: string): Promise<BreedingRecord> {
    const record = await this.breedingRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`繁殖记录 #${id} 不存在`);
    }

    if (dto.maleId && dto.maleId !== record.maleId) {
      const male = await this.animalRepository.findOne({ where: { id: dto.maleId } });
      if (!male) {
        throw new NotFoundException(`雄性动物 #${dto.maleId} 不存在`);
      }
      if (male.gender !== 'male') {
        throw new BadRequestException('雄性动物必须是雄性');
      }
    }

    if (dto.femaleId && dto.femaleId !== record.femaleId) {
      const female = await this.animalRepository.findOne({ where: { id: dto.femaleId } });
      if (!female) {
        throw new NotFoundException(`雌性动物 #${dto.femaleId} 不存在`);
      }
      if (female.gender !== 'female') {
        throw new BadRequestException('雌性动物必须是雌性');
      }
    }

    Object.assign(record, dto);
    if (operator) {
      record.operator = operator;
    }
    return this.breedingRecordRepository.save(record);
  }

  async deleteBreedingRecord(id: number): Promise<void> {
    const record = await this.breedingRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`繁殖记录 #${id} 不存在`);
    }
    await this.breedingRecordRepository.remove(record);
    this.logger.log(`Deleted breeding record: ${id}`);
  }

  async getBreedingRecord(id: number): Promise<BreedingRecord> {
    const record = await this.breedingRecordRepository.findOne({
      where: { id },
      relations: ['male', 'female'],
    });
    if (!record) {
      throw new NotFoundException(`繁殖记录 #${id} 不存在`);
    }
    return record;
  }

  async getBreedingRecords(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    animalId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ list: BreedingRecord[]; total: number }> {
    const { page = 1, pageSize = 10, status, animalId, startDate, endDate } = query;
    const qb = this.breedingRecordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.male', 'male')
      .leftJoinAndSelect('record.female', 'female');

    if (status) {
      qb.andWhere('record.status = :status', { status });
    }

    if (animalId) {
      qb.andWhere('(record.male_id = :animalId OR record.female_id = :animalId)', { animalId });
    }

    if (startDate) {
      qb.andWhere('record.pairing_date >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('record.pairing_date <= :endDate', { endDate });
    }

    qb.orderBy('record.pairing_date', 'DESC');

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total };
  }

  async getBreedingRecordsByAnimal(animalId: number): Promise<BreedingRecord[]> {
    return this.breedingRecordRepository.find({
      where: [{ maleId: animalId }, { femaleId: animalId }],
      relations: ['male', 'female'],
      order: { pairingDate: 'DESC' },
    });
  }
}
