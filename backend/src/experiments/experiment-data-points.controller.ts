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
import { ExperimentDataPointsService } from './experiment-data-points.service';
import { CreateExperimentDataPointDto, BatchCreateExperimentDataPointDto } from './dto/create-experiment-data-point.dto';
import { UpdateExperimentDataPointDto } from './dto/update-experiment-data-point.dto';

@ApiTags('实验数据点')
@Controller('experiment-data-points')
export class ExperimentDataPointsController {
  constructor(private readonly dataPointsService: ExperimentDataPointsService) {}

  @Post()
  @ApiOperation({ summary: '创建单个数据点' })
  create(@Body() dto: CreateExperimentDataPointDto) {
    return this.dataPointsService.create(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建数据点' })
  batchCreate(@Body() dto: BatchCreateExperimentDataPointDto) {
    return this.dataPointsService.batchCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询数据点列表' })
  @ApiQuery({ name: 'experimentId', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'metricName', required: false })
  @ApiQuery({ name: 'dataType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(
    @Query('experimentId') experimentId?: number,
    @Query('animalId') animalId?: number,
    @Query('metricName') metricName?: string,
    @Query('dataType') dataType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.dataPointsService.findAll({
      experimentId: experimentId ? Number(experimentId) : undefined,
      animalId: animalId ? Number(animalId) : undefined,
      metricName,
      dataType,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('metrics')
  @ApiOperation({ summary: '获取实验下所有指标名称' })
  @ApiQuery({ name: 'experimentId', required: true })
  getMetricNames(@Query('experimentId', ParseIntPipe) experimentId: number) {
    return this.dataPointsService.getMetricNames(experimentId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '统计聚合数据' })
  @ApiQuery({ name: 'experimentId', required: true })
  @ApiQuery({ name: 'metricName', required: true })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['animal', 'day', 'week'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'animalIds', required: false })
  getStatistics(
    @Query('experimentId', ParseIntPipe) experimentId: number,
    @Query('metricName') metricName: string,
    @Query('groupBy') groupBy?: 'animal' | 'day' | 'week',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('animalIds') animalIds?: string,
  ) {
    const animalIdList = animalIds
      ? animalIds.split(',').map(id => Number(id)).filter(id => !isNaN(id))
      : undefined;
    return this.dataPointsService.getStatistics({
      experimentId,
      metricName,
      groupBy,
      startDate,
      endDate,
      animalIds: animalIdList,
    });
  }

  @Get('time-series')
  @ApiOperation({ summary: '获取时间序列数据' })
  @ApiQuery({ name: 'experimentId', required: true })
  @ApiQuery({ name: 'metricName', required: true })
  @ApiQuery({ name: 'animalIds', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getTimeSeries(
    @Query('experimentId', ParseIntPipe) experimentId: number,
    @Query('metricName') metricName: string,
    @Query('animalIds') animalIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const animalIdList = animalIds
      ? animalIds.split(',').map(id => Number(id)).filter(id => !isNaN(id))
      : undefined;
    return this.dataPointsService.getTimeSeries({
      experimentId,
      metricName,
      animalIds: animalIdList,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据点详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dataPointsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新数据点' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExperimentDataPointDto,
  ) {
    return this.dataPointsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据点' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dataPointsService.remove(id);
  }
}
