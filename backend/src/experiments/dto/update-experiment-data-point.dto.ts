import { PartialType } from '@nestjs/swagger';
import { CreateExperimentDataPointDto } from './create-experiment-data-point.dto';

export class UpdateExperimentDataPointDto extends PartialType(CreateExperimentDataPointDto) {}
