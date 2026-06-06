import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnimalDto {
  @ApiProperty({ description: '动物名称/编号', example: 'M-001' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '物种', example: '小鼠' })
  @IsString()
  @MaxLength(50)
  species: string;

  @ApiPropertyOptional({ description: '品系/品种', example: 'C57BL/6' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  breed?: string;

  @ApiProperty({ description: '性别', enum: ['male', 'female', 'unknown'] })
  @IsEnum(['male', 'female', 'unknown'])
  gender: string;

  @ApiPropertyOptional({ description: '出生日期', example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: '体重(g)', example: 25.3 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ description: '状态', enum: ['healthy', 'sick', 'in_experiment', 'deceased', 'quarantine'] })
  @IsEnum(['healthy', 'sick', 'in_experiment', 'deceased', 'quarantine'])
  status: string;

  @ApiPropertyOptional({ description: '笼号', example: 'A-101' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cageNumber?: string;

  @ApiPropertyOptional({ description: 'RFID标签' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rfidTag?: string;

  @ApiPropertyOptional({ description: '来源' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @ApiPropertyOptional({ description: '备注描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
