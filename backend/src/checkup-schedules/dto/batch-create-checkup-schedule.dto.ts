import { IsArray, IsDateString, IsNumber, IsOptional, IsEnum, IsString, MaxLength, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchCreateCheckupScheduleDto {
  @ApiProperty({ description: '动物ID列表', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  animalIds: number[];

  @ApiProperty({ description: '开始日期', example: '2026-01-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '间隔天数' })
  @IsNumber()
  intervalDays: number;

  @ApiProperty({ description: '重复次数' })
  @IsNumber()
  times: number;

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

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
