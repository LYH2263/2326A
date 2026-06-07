import { IsInt, IsDateString, IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBreedingRecordDto {
  @ApiProperty({ description: '雄性动物ID', example: 1 })
  @IsInt()
  maleId: number;

  @ApiProperty({ description: '雌性动物ID', example: 2 })
  @IsInt()
  femaleId: number;

  @ApiProperty({ description: '配对日期', example: '2025-06-15' })
  @IsDateString()
  pairingDate: string;

  @ApiPropertyOptional({ description: '预计出生日期', example: '2025-08-20' })
  @IsOptional()
  @IsDateString()
  expectedBirthDate?: string;

  @ApiPropertyOptional({ description: '实际出生日期', example: '2025-08-25' })
  @IsOptional()
  @IsDateString()
  actualBirthDate?: string;

  @ApiPropertyOptional({ description: '产仔数量', example: 8 })
  @IsOptional()
  @IsInt()
  litterCount?: number;

  @ApiPropertyOptional({ description: '存活数量', example: 6 })
  @IsOptional()
  @IsInt()
  survivalCount?: number;

  @ApiPropertyOptional({ description: '雄性幼崽数量', example: 3 })
  @IsOptional()
  @IsInt()
  maleCount?: number;

  @ApiPropertyOptional({ description: '雌性幼崽数量', example: 3 })
  @IsOptional()
  @IsInt()
  femaleCount?: number;

  @ApiPropertyOptional({
    description: '繁殖状态',
    enum: ['planned', 'pairing', 'pregnant', 'birthed', 'weaned', 'failed'],
    default: 'planned',
  })
  @IsOptional()
  @IsEnum(['planned', 'pairing', 'pregnant', 'birthed', 'weaned', 'failed'])
  status?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
