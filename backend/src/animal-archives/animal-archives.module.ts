import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalArchivesService } from './animal-archives.service';
import { AnimalArchivesController } from './animal-archives.controller';
import { Animal } from '../animals/entities/animal.entity';
import { HealthRecord } from '../health/entities/health-record.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';
import { ExperimentAnimal } from '../experiments/entities/experiment-animal.entity';
import { Experiment } from '../experiments/entities/experiment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Animal,
      HealthRecord,
      FeedingRecord,
      ExperimentAnimal,
      Experiment,
    ]),
  ],
  providers: [AnimalArchivesService],
  controllers: [AnimalArchivesController],
  exports: [AnimalArchivesService],
})
export class AnimalArchivesModule {}
