import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAnimalDto } from './create-animal.dto';

export class UpdateAnimalDto extends PartialType(CreateAnimalDto) {
  @ApiPropertyOptional({ description: '状态变更原因' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  statusChangeReason?: string;

  @ApiPropertyOptional({ description: '关联实验ID' })
  @IsOptional()
  @IsNumber()
  experimentId?: number;
}
