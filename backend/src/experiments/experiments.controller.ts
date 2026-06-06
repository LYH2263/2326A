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
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { UpdateExperimentDto } from './dto/update-experiment.dto';
import { CreateExperimentAnimalDto } from './dto/create-experiment-animal.dto';

@ApiTags('实验项目')
@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post()
  @ApiOperation({ summary: '创建实验项目' })
  create(@Body() dto: CreateExperimentDto) {
    return this.experimentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询实验项目列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.experimentsService.findAll({ page, pageSize, status, keyword });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取实验项目详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.experimentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新实验项目' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExperimentDto,
  ) {
    return this.experimentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除实验项目' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.experimentsService.remove(id);
  }

  @Post('animals')
  @ApiOperation({ summary: '关联动物到实验' })
  addAnimal(@Body() dto: CreateExperimentAnimalDto) {
    return this.experimentsService.addAnimal(dto);
  }

  @Delete('animals/:id')
  @ApiOperation({ summary: '取消动物实验关联' })
  removeAnimal(@Param('id', ParseIntPipe) id: number) {
    return this.experimentsService.removeAnimal(id);
  }
}
