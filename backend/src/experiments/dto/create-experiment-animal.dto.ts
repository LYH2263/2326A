import { IsNumber, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExperimentAnimalDto {
  @ApiProperty({ description: '实验ID' })
  @IsNumber()
  experimentId: number;

  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiPropertyOptional({ description: '角色', example: 'treatment_group' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @ApiPropertyOptional({ description: '加入日期' })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiPropertyOptional({ description: '离开日期' })
  @IsOptional()
  @IsDateString()
  leaveDate?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
