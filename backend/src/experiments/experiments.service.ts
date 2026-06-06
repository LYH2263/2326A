import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Experiment } from './entities/experiment.entity';
import { ExperimentAnimal } from './entities/experiment-animal.entity';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { UpdateExperimentDto } from './dto/update-experiment.dto';
import { CreateExperimentAnimalDto } from './dto/create-experiment-animal.dto';

@Injectable()
export class ExperimentsService {
  private readonly logger = new Logger(ExperimentsService.name);

  constructor(
    @InjectRepository(Experiment)
    private readonly experimentRepository: Repository<Experiment>,
    @InjectRepository(ExperimentAnimal)
    private readonly experimentAnimalRepository: Repository<ExperimentAnimal>,
  ) {}

  async create(dto: CreateExperimentDto): Promise<Experiment> {
    const experiment = this.experimentRepository.create(dto);
    const saved = await this.experimentRepository.save(experiment);
    this.logger.log(`Created experiment: ${saved.id} - ${saved.name}`);
    return saved;
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }): Promise<{ list: Experiment[]; total: number }> {
    const { page = 1, pageSize = 10, status, keyword } = query;
    const where: any = {};

    if (status) where.status = status;
    if (keyword) where.name = Like(`%${keyword}%`);

    const [list, total] = await this.experimentRepository.findAndCount({
      where,
      relations: ['experimentAnimals', 'experimentAnimals.animal'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total };
  }

  async findOne(id: number): Promise<Experiment> {
    const experiment = await this.experimentRepository.findOne({
      where: { id },
      relations: ['experimentAnimals', 'experimentAnimals.animal'],
    });
    if (!experiment) {
      throw new NotFoundException(`实验项目 #${id} 不存在`);
    }
    return experiment;
  }

  async update(id: number, dto: UpdateExperimentDto): Promise<Experiment> {
    const experiment = await this.findOne(id);
    Object.assign(experiment, dto);
    const updated = await this.experimentRepository.save(experiment);
    this.logger.log(`Updated experiment: ${updated.id}`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const experiment = await this.findOne(id);
    await this.experimentRepository.remove(experiment);
    this.logger.log(`Removed experiment: ${id}`);
  }

  async addAnimal(dto: CreateExperimentAnimalDto): Promise<ExperimentAnimal> {
    const ea = this.experimentAnimalRepository.create(dto);
    const saved = await this.experimentAnimalRepository.save(ea);
    this.logger.log(`Added animal ${dto.animalId} to experiment ${dto.experimentId}`);
    return saved;
  }

  async removeAnimal(id: number): Promise<void> {
    const ea = await this.experimentAnimalRepository.findOne({ where: { id } });
    if (!ea) {
      throw new NotFoundException(`关联记录 #${id} 不存在`);
    }
    await this.experimentAnimalRepository.remove(ea);
    this.logger.log(`Removed experiment-animal association: ${id}`);
  }

  async countByStatus(): Promise<{ status: string; count: number }[]> {
    return this.experimentRepository
      .createQueryBuilder('exp')
      .select('exp.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('exp.status')
      .getRawMany();
  }

  async countByDepartment(): Promise<{ department: string; count: number }[]> {
    return this.experimentRepository
      .createQueryBuilder('exp')
      .select('exp.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .groupBy('exp.department')
      .getRawMany();
  }
}
