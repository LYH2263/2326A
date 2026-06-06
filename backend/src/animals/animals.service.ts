import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Animal } from './entities/animal.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

@Injectable()
export class AnimalsService {
  private readonly logger = new Logger(AnimalsService.name);

  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
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
}
