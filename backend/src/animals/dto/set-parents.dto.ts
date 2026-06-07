import { IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SetParentsDto {
  @ApiPropertyOptional({ description: '父亲动物ID', example: 1 })
  @IsOptional()
  @IsInt()
  fatherId?: number;

  @ApiPropertyOptional({ description: '母亲动物ID', example: 2 })
  @IsOptional()
  @IsInt()
  motherId?: number;
}
