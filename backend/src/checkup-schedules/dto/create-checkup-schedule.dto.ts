import { IsNumber, IsOptional, IsEnum, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckupScheduleDto {
  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '计划检查日期', example: '2026-01-15' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ description: '时间段', enum: ['morning', 'afternoon'] })
  @IsOptional()
  @IsEnum(['morning', 'afternoon'])
  timeSlot?: string;

  @ApiPropertyOptional({ description: '负责兽医' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  veterinarian?: string;

  @ApiPropertyOptional({ description: '检查类型', enum: ['routine', 'pre_experiment', 'post_treatment', 'follow_up'] })
  @IsOptional()
  @IsEnum(['routine', 'pre_experiment', 'post_treatment', 'follow_up'])
  checkType?: string;

  @ApiPropertyOptional({ description: '优先级', enum: ['normal', 'high', 'urgent'] })
  @IsOptional()
  @IsEnum(['normal', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['scheduled', 'completed', 'missed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['scheduled', 'completed', 'missed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ description: '关联健康记录ID' })
  @IsOptional()
  @IsNumber()
  healthRecordId?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
