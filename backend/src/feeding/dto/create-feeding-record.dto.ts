import { IsNumber, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedingRecordDto {
  @ApiProperty({ description: '动物ID' })
  @IsNumber()
  animalId: number;

  @ApiProperty({ description: '喂养日期', example: '2026-01-20' })
  @IsDateString()
  feedDate: string;

  @ApiPropertyOptional({ description: '喂养时间', example: '08:00:00' })
  @IsOptional()
  @IsString()
  feedTime?: string;

  @ApiProperty({ description: '饲料类型', example: '标准啮齿类动物饲料' })
  @IsString()
  @MaxLength(100)
  foodType: string;

  @ApiPropertyOptional({ description: '数量', example: 5.0 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: '单位', example: 'g' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ description: '饮水量(ml)', example: 8.0 })
  @IsOptional()
  @IsNumber()
  waterMl?: number;

  @ApiPropertyOptional({ description: '喂养员' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  feeder?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
