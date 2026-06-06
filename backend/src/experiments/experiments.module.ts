import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { Experiment } from './entities/experiment.entity';
import { ExperimentAnimal } from './entities/experiment-animal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Experiment, ExperimentAnimal])],
  controllers: [ExperimentsController],
  providers: [ExperimentsService],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}
