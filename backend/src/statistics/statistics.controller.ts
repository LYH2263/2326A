import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('数据统计')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取总览统计数据' })
  getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get('animals')
  @ApiOperation({ summary: '获取动物统计数据' })
  getAnimalStatistics() {
    return this.statisticsService.getAnimalStatistics();
  }

  @Get('experiments')
  @ApiOperation({ summary: '获取实验统计数据' })
  getExperimentStatistics() {
    return this.statisticsService.getExperimentStatistics();
  }

  @Get('feeding')
  @ApiOperation({ summary: '获取饲养统计数据' })
  getFeedingStatistics() {
    return this.statisticsService.getFeedingStatistics();
  }
}
