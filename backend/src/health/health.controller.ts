import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';

@ApiTags('健康记录')
@Controller('health-records')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post()
  @ApiOperation({ summary: '添加健康记录' })
  create(@Body() dto: CreateHealthRecordDto) {
    return this.healthService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询健康记录列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'condition', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('animalId') animalId?: number,
    @Query('condition') condition?: string,
  ) {
    return this.healthService.findAll({ page, pageSize, animalId, condition });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取健康记录详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.healthService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新健康记录' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHealthRecordDto,
  ) {
    return this.healthService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除健康记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.healthService.remove(id);
  }

  @Get('trend/:animalId')
  @ApiOperation({ summary: '单动物健康指标趋势' })
  @ApiQuery({ name: 'limit', required: false, description: '最近N次记录，默认10，最大50' })
  getAnimalTrend(
    @Param('animalId', ParseIntPipe) animalId: number,
    @Query('limit') limit?: number,
  ) {
    return this.healthService.getAnimalTrend(animalId, limit);
  }

  @Get('comparison/multi')
  @ApiOperation({ summary: '多动物健康指标横向对比' })
  @ApiQuery({ name: 'animalIds', required: true, description: '动物ID列表，逗号分隔，最多5只' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getMultiAnimalComparison(
    @Query('animalIds') animalIds: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const ids = animalIds
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    return this.healthService.getMultiAnimalComparison(ids, startDate, endDate);
  }

  @Get('normal-ranges')
  @ApiOperation({ summary: '获取物种正常指标范围' })
  @ApiQuery({ name: 'species', required: false })
  getNormalRanges(@Query('species') species?: string) {
    return this.healthService.getNormalRanges(species);
  }
}
