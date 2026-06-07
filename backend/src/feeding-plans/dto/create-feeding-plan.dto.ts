import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, MaxLength, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedingPlanDto {
  @ApiProperty({ description: '计划名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  planName: string;

  @ApiProperty({ description: '目标类型', enum: ['animal', 'cage'] })
  @IsEnum(['animal', 'cage'])
  targetType: string;

  @ApiPropertyOptional({ description: '动物ID' })
  @IsOptional()
  @IsNumber()
  animalId?: number;

  @ApiPropertyOptional({ description: '笼号' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cageNumber?: string;

  @ApiProperty({ description: '饲料类型' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  foodType: string;

  @ApiPropertyOptional({ description: '计划喂养量' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: '单位' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ description: '饮水量(ml)' })
  @IsOptional()
  @IsNumber()
  waterMl?: number;

  @ApiProperty({ description: '计划喂养时间', example: '08:00:00' })
  @IsString()
  @IsNotEmpty()
  feedTime: string;

  @ApiProperty({ description: '重复类型', enum: ['daily', 'weekly', 'cron'] })
  @IsEnum(['daily', 'weekly', 'cron'])
  repeatType: string;

  @ApiPropertyOptional({ description: '每周重复日(1-7,逗号分隔,1=周一)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  repeatDays?: string;

  @ApiPropertyOptional({ description: 'Cron表达式' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cronExpression?: string;

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  feeder?: string;

  @ApiProperty({ description: '有效期开始日期' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: '有效期结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'paused', 'expired'] })
  @IsOptional()
  @IsEnum(['active', 'paused', 'expired'])
  status?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
