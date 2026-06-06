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
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

@ApiTags('动物管理')
@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  @ApiOperation({ summary: '添加动物' })
  create(@Body() createAnimalDto: CreateAnimalDto) {
    return this.animalsService.create(createAnimalDto);
  }

  @Get()
  @ApiOperation({ summary: '查询动物列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('species') species?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.animalsService.findAll({ page, pageSize, species, status, keyword });
  }

  @Get('species')
  @ApiOperation({ summary: '获取物种列表' })
  getSpeciesList() {
    return this.animalsService.getSpeciesList();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取动物详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新动物信息' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimalDto: UpdateAnimalDto,
  ) {
    return this.animalsService.update(id, updateAnimalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除动物' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.remove(id);
  }
}
