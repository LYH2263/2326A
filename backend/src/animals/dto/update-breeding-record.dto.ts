import { PartialType } from '@nestjs/swagger';
import { CreateBreedingRecordDto } from './create-breeding-record.dto';

export class UpdateBreedingRecordDto extends PartialType(CreateBreedingRecordDto) {}
