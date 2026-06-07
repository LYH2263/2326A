import { IsString, IsNotEmpty, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStatusChangeRequestDto {
  @ApiProperty({ description: '动物ID' })
  @IsNotEmpty()
  animalId: number;

  @ApiProperty({ description: '目标状态' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  toStatus: string;

  @ApiProperty({ description: '变更原因' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ApproveStatusChangeRequestDto {
  @ApiProperty({ description: '审批状态', enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'], { message: '审批状态只能是 approved 或 rejected' })
  status: 'approved' | 'rejected';

  @ApiProperty({ description: '审批意见', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
