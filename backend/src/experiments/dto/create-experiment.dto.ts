import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExperimentDto {
  @ApiProperty({ description: '实验名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '项目编号', example: 'EXP-2025-001' })
  @IsString()
  @MaxLength(50)
  projectCode: string;

  @ApiPropertyOptional({ description: '实验描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '状态', enum: ['planning', 'in_progress', 'completed', 'suspended', 'cancelled'] })
  @IsEnum(['planning', 'in_progress', 'completed', 'suspended', 'cancelled'])
  status: string;

  @ApiPropertyOptional({ description: '负责研究员' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  researcher?: string;

  @ApiPropertyOptional({ description: '所属部门' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
