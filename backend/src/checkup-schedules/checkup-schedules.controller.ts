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
import { CheckupSchedulesService } from './checkup-schedules.service';
import { CreateCheckupScheduleDto } from './dto/create-checkup-schedule.dto';
import { UpdateCheckupScheduleDto } from './dto/update-checkup-schedule.dto';
import { BatchCreateCheckupScheduleDto } from './dto/batch-create-checkup-schedule.dto';
import { CompleteCheckupScheduleDto } from './dto/complete-checkup-schedule.dto';

@ApiTags('体检排班')
@Controller('checkup-schedules')
export class CheckupSchedulesController {
  constructor(private readonly checkupSchedulesService: CheckupSchedulesService) {}

  @Post()
  @ApiOperation({ summary: '创建体检排班' })
  create(@Body() dto: CreateCheckupScheduleDto) {
    return this.checkupSchedulesService.create(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建体检排班' })
  batchCreate(@Body() dto: BatchCreateCheckupScheduleDto) {
    return this.checkupSchedulesService.batchCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询排班列表（分页）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'checkType', required: false })
  @ApiQuery({ name: 'veterinarian', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('animalId') animalId?: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('checkType') checkType?: string,
    @Query('veterinarian') veterinarian?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.checkupSchedulesService.findAll({
      page,
      pageSize,
      animalId,
      status,
      priority,
      checkType,
      veterinarian,
      startDate,
      endDate,
    });
  }

  @Get('date-range')
  @ApiOperation({ summary: '按日期范围查询排班（日历视图用）' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'veterinarian', required: false })
  @ApiQuery({ name: 'checkType', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'status', required: false })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('veterinarian') veterinarian?: string,
    @Query('checkType') checkType?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
  ) {
    return this.checkupSchedulesService.findByDateRange(startDate, endDate, {
      veterinarian,
      checkType,
      priority,
      status,
    });
  }

  @Get('veterinarians')
  @ApiOperation({ summary: '获取所有兽医列表（用于筛选）' })
  getVeterinarians() {
    return this.checkupSchedulesService.getVeterinarians();
  }

  @Get('daily-stats')
  @ApiOperation({ summary: '获取某日排班统计' })
  @ApiQuery({ name: 'date', required: true })
  getDailyStats(@Query('date') date: string) {
    return this.checkupSchedulesService.getDailyStats(date);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取排班详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.checkupSchedulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新排班' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCheckupScheduleDto,
  ) {
    return this.checkupSchedulesService.update(id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成排班并关联健康记录' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteCheckupScheduleDto,
  ) {
    return this.checkupSchedulesService.complete(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消排班' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes?: string,
  ) {
    return this.checkupSchedulesService.cancel(id, notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除排班' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.checkupSchedulesService.remove(id);
  }
}
