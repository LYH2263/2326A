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
import { FeedingPlansService } from './feeding-plans.service';
import { CreateFeedingPlanDto } from './dto/create-feeding-plan.dto';
import { UpdateFeedingPlanDto } from './dto/update-feeding-plan.dto';
import { CompleteFeedingTaskDto } from './dto/complete-feeding-task.dto';

@ApiTags('饲养计划')
@Controller('feeding-plans')
export class FeedingPlansController {
  constructor(private readonly feedingPlansService: FeedingPlansService) {}

  @Post()
  @ApiOperation({ summary: '创建饲养计划' })
  create(@Body() dto: CreateFeedingPlanDto) {
    return this.feedingPlansService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询饲养计划列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  @ApiQuery({ name: 'feeder', required: false })
  @ApiQuery({ name: 'foodType', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('targetType') targetType?: string,
    @Query('feeder') feeder?: string,
    @Query('foodType') foodType?: string,
  ) {
    return this.feedingPlansService.findAll({ page, pageSize, status, targetType, feeder, foodType });
  }

  @Get('date-range')
  @ApiOperation({ summary: '按日期范围查询饲养计划' })
  getPlansByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: string,
    @Query('feeder') feeder?: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.feedingPlansService.getPlansByDateRange(startDate, endDate, { status, feeder, targetType });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取饲养计划详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedingPlansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新饲养计划' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeedingPlanDto,
  ) {
    return this.feedingPlansService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除饲养计划' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.feedingPlansService.remove(id);
  }

  @Post('generate-tasks')
  @ApiOperation({ summary: '手动生成指定日期的饲养任务' })
  generateTasks(@Query('date') date?: string) {
    return this.feedingPlansService.generateDailyTasks(date);
  }

  @Get('tasks/date-range')
  @ApiOperation({ summary: '按日期范围查询饲养任务' })
  getTasksByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: string,
    @Query('feeder') feeder?: string,
    @Query('animalId') animalId?: number,
    @Query('planId') planId?: number,
  ) {
    return this.feedingPlansService.getTasksByDateRange(startDate, endDate, {
      status,
      feeder,
      animalId,
      planId,
    });
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: '获取饲养任务详情' })
  getTask(@Param('id', ParseIntPipe) id: number) {
    return this.feedingPlansService.getTask(id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: '更新饲养任务' })
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.feedingPlansService.updateTask(id, data);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: '删除饲养任务' })
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.feedingPlansService.deleteTask(id);
  }

  @Patch('tasks/:id/complete')
  @ApiOperation({ summary: '完成饲养任务并创建饲养记录' })
  completeTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteFeedingTaskDto,
  ) {
    return this.feedingPlansService.completeTask(id, dto);
  }

  @Patch('tasks/:id/cancel')
  @ApiOperation({ summary: '取消饲养任务' })
  cancelTask(
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes?: string,
  ) {
    return this.feedingPlansService.cancelTask(id, notes);
  }

  @Get('feeders/list')
  @ApiOperation({ summary: '获取所有负责人列表' })
  getFeeders() {
    return this.feedingPlansService.getFeeders();
  }

  @Get('food-types/list')
  @ApiOperation({ summary: '获取所有饲料类型列表' })
  getFoodTypes() {
    return this.feedingPlansService.getFoodTypes();
  }

  @Get('daily-stats')
  @ApiOperation({ summary: '获取每日任务统计' })
  getDailyStats(@Query('date') date: string) {
    return this.feedingPlansService.getDailyStats(date);
  }

  @Get('daily-stats/range')
  @ApiOperation({ summary: '按日期范围获取每日任务统计' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'feeder', required: false })
  getDailyStatsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('feeder') feeder?: string,
  ) {
    return this.feedingPlansService.getDailyStatsByDateRange(startDate, endDate, { feeder });
  }
}
