import { IsNumber, IsOptional, IsEnum, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteCheckupScheduleDto {
  @ApiProperty({ description: '关联健康记录ID（可选，如果不传则创建新记录）' })
  @IsOptional()
  @IsNumber()
  healthRecordId?: number;

  @ApiPropertyOptional({ description: '检查日期（创建健康记录时用）', example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  checkDate?: string;

  @ApiPropertyOptional({ description: '体温(℃)' })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ description: '体重(g)' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: '心率(次/分)' })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ description: '呼吸频率(次/分)' })
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @ApiPropertyOptional({ description: '健康状况', enum: ['normal', 'abnormal', 'critical'] })
  @IsOptional()
  @IsEnum(['normal', 'abnormal', 'critical'])
  condition?: string;

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
