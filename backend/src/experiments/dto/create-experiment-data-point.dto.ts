import { IsNumber, IsOptional, IsString, IsEnum, IsDateString, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExperimentDataPointDto {
  @ApiProperty({ description: '实验ID' })
  @IsNumber()
  experimentId: number;

  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '采集时间' })
  @IsDateString()
  collectedAt: string;

  @ApiProperty({ description: '指标名称' })
  @IsString()
  @MaxLength(100)
  metricName: string;

  @ApiProperty({ description: '数据类型', enum: ['numeric', 'text', 'option'] })
  @IsEnum(['numeric', 'text', 'option'])
  dataType: string;

  @ApiPropertyOptional({ description: '数值型数值' })
  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @ApiPropertyOptional({ description: '文本型数值' })
  @IsOptional()
  @IsString()
  textValue?: string;

  @ApiPropertyOptional({ description: '选项型数值' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  optionValue?: string;

  @ApiPropertyOptional({ description: '单位' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchCreateExperimentDataPointDto {
  @ApiProperty({ description: '数据点列表', type: [CreateExperimentDataPointDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperimentDataPointDto)
  points: CreateExperimentDataPointDto[];
}
