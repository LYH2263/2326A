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
import { FeedingService } from './feeding.service';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { UpdateFeedingRecordDto } from './dto/update-feeding-record.dto';

@ApiTags('饲养记录')
@Controller('feeding-records')
export class FeedingController {
  constructor(private readonly feedingService: FeedingService) {}

  @Post()
  @ApiOperation({ summary: '添加饲养记录' })
  create(@Body() dto: CreateFeedingRecordDto) {
    return this.feedingService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询饲养记录列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'feedDate', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('animalId') animalId?: number,
    @Query('feedDate') feedDate?: string,
  ) {
    return this.feedingService.findAll({ page, pageSize, animalId, feedDate });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取饲养记录详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新饲养记录' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeedingRecordDto,
  ) {
    return this.feedingService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除饲养记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.feedingService.remove(id);
  }
}
