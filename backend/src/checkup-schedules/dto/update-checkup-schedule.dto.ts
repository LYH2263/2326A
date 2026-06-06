import { PartialType } from '@nestjs/swagger';
import { CreateCheckupScheduleDto } from './create-checkup-schedule.dto';

export class UpdateCheckupScheduleDto extends PartialType(CreateCheckupScheduleDto) {}
