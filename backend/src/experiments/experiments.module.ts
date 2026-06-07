import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { Experiment } from './entities/experiment.entity';
import { ExperimentAnimal } from './entities/experiment-animal.entity';
import { ExperimentDataPoint } from './entities/experiment-data-point.entity';
import { ExperimentDataPointsController } from './experiment-data-points.controller';
import { ExperimentDataPointsService } from './experiment-data-points.service';

@Module({
  imports: [TypeOrmModule.forFeature([Experiment, ExperimentAnimal, ExperimentDataPoint])],
  controllers: [ExperimentsController, ExperimentDataPointsController],
  providers: [ExperimentsService, ExperimentDataPointsService],
  exports: [ExperimentsService, ExperimentDataPointsService],
})
export class ExperimentsModule {}
