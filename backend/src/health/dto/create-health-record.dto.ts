import { IsNumber, IsOptional, IsEnum, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHealthRecordDto {
  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '检查日期', example: '2025-12-01' })
  @IsDateString()
  checkDate: string;

  @ApiPropertyOptional({ description: '体温(℃)', example: 37.2 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ description: '体重(g)', example: 25.3 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: '心率(次/分)', example: 600 })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ description: '呼吸频率(次/分)', example: 160 })
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @ApiProperty({ description: '健康状况', enum: ['normal', 'abnormal', 'critical'] })
  @IsEnum(['normal', 'abnormal', 'critical'])
  condition: string;

  @ApiPropertyOptional({ description: '诊断' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: '治疗方案' })
  @IsOptional()
  @IsString()
  treatment?: string;

  @ApiPropertyOptional({ description: '兽医' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  veterinarian?: string;

  @ApiPropertyOptional({ description: '下次检查日期' })
  @IsOptional()
  @IsDateString()
  nextCheckDate?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
