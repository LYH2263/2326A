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
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnimalsService } from './animals.service';
import { AuthService } from '../auth/auth.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CageSplitDto, CageMergeDto, CageTransferLogQueryDto } from './dto/cage-transfer.dto';

@ApiTags('动物管理')
@Controller('animals')
export class AnimalsController {
  constructor(
    private readonly animalsService: AnimalsService,
    private readonly authService: AuthService,
  ) {}

  private async getOperatorFromToken(authHeader?: string): Promise<string | undefined> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    try {
      const token = authHeader.replace('Bearer ', '');
      const user = await this.authService.getProfile(token);
      return user.name || user.username;
    } catch {
      return undefined;
    }
  }

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

  @Post('cage-split')
  @ApiOperation({ summary: '分笼操作' })
  async cageSplit(
    @Body() dto: CageSplitDto,
    @Headers('authorization') auth?: string,
  ) {
    const operator = await this.getOperatorFromToken(auth);
    return this.animalsService.cageSplit(dto, operator);
  }

  @Post('cage-merge')
  @ApiOperation({ summary: '合笼操作' })
  async cageMerge(
    @Body() dto: CageMergeDto,
    @Headers('authorization') auth?: string,
  ) {
    const operator = await this.getOperatorFromToken(auth);
    return this.animalsService.cageMerge(dto, operator);
  }

  @Get('transfer-logs')
  @ApiOperation({ summary: '查询笼位变更历史' })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'cageNumber', required: false })
  @ApiQuery({ name: 'operationType', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  getTransferLogs(
    @Query('animalId') animalId?: number,
    @Query('cageNumber') cageNumber?: string,
    @Query('operationType') operationType?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.animalsService.getTransferLogs({
      animalId: animalId ? Number(animalId) : undefined,
      cageNumber,
      operationType,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(':id/transfer-logs')
  @ApiOperation({ summary: '获取单只动物的笼位变更历史' })
  getAnimalTransferLogs(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.getTransferLogsByAnimal(id);
  }
}
