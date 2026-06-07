import { IsArray, IsString, IsOptional, IsEnum, IsNotEmpty, ArrayMinSize, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CageSplitDto {
  @ApiProperty({ description: '动物ID列表', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  animalIds: number[];

  @ApiProperty({ description: '目标笼号' })
  @IsString()
  @IsNotEmpty()
  targetCage: string;

  @ApiPropertyOptional({ description: '操作原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CageMergeDto {
  @ApiProperty({ description: '动物ID列表', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  animalIds: number[];

  @ApiProperty({ description: '目标笼号' })
  @IsString()
  @IsNotEmpty()
  targetCage: string;

  @ApiPropertyOptional({ description: '操作原因' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: '是否确认不同物种合并' })
  @IsOptional()
  @IsBoolean()
  confirmSpeciesMixed?: boolean;
}

export class CageTransferLogQueryDto {
  @ApiPropertyOptional({ description: '动物ID' })
  @IsOptional()
  animalId?: number;

  @ApiPropertyOptional({ description: '笼号' })
  @IsOptional()
  @IsString()
  cageNumber?: string;

  @ApiPropertyOptional({ description: '操作类型', enum: ['move_in', 'move_out', 'cage_split', 'cage_merge'] })
  @IsOptional()
  @IsEnum(['move_in', 'move_out', 'cage_split', 'cage_merge'])
  operationType?: string;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  pageSize?: number;
}
