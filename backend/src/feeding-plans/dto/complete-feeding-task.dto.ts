import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteFeedingTaskDto {
  @ApiPropertyOptional({ description: '实际喂养量' })
  @IsOptional()
  @IsNumber()
  actualQuantity?: number;

  @ApiPropertyOptional({ description: '实际饮水量(ml)' })
  @IsOptional()
  @IsNumber()
  actualWaterMl?: number;

  @ApiPropertyOptional({ description: '实际喂养时间' })
  @IsOptional()
  @IsString()
  actualFeedTime?: string;

  @ApiPropertyOptional({ description: '喂养员' })
  @IsOptional()
  @IsString()
  feeder?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
