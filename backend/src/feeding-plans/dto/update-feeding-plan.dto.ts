import { PartialType } from '@nestjs/swagger';
import { CreateFeedingPlanDto } from './create-feeding-plan.dto';

export class UpdateFeedingPlanDto extends PartialType(CreateFeedingPlanDto) {}
