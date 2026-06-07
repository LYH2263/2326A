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
import { SetParentsDto } from './dto/set-parents.dto';
import { CreateBreedingRecordDto } from './dto/create-breeding-record.dto';
import { UpdateBreedingRecordDto } from './dto/update-breeding-record.dto';
import { CreateStatusChangeRequestDto, ApproveStatusChangeRequestDto } from './dto/status-change-request.dto';

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
    return this.animalsService.findAll({
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
      species,
      status,
      keyword,
    });
  }

  @Get('species')
  @ApiOperation({ summary: '获取物种列表' })
  getSpeciesList() {
    return this.animalsService.getSpeciesList();
  }

  @Post('status-change-requests')
  @ApiOperation({ summary: '提交状态变更申请' })
  async createStatusChangeRequest(
    @Body() dto: CreateStatusChangeRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    const operator = await this.getOperatorFromToken(auth);
    const applicant = operator || '匿名用户';
    return this.animalsService.createStatusChangeRequest(dto, applicant);
  }

  @Get('status-change-requests')
  @ApiOperation({ summary: '查询状态变更申请列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'approvalStatus', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'applicant', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  getStatusChangeRequests(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('approvalStatus') approvalStatus?: string,
    @Query('animalId') animalId?: number,
    @Query('applicant') applicant?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.animalsService.getStatusChangeRequests({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      approvalStatus,
      animalId: animalId ? Number(animalId) : undefined,
      applicant,
      keyword,
    });
  }

  @Get('status-change-requests/:id')
  @ApiOperation({ summary: '获取状态变更申请详情' })
  getStatusChangeRequest(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.getStatusChangeRequest(id);
  }

  @Patch('status-change-requests/:id/approve')
  @ApiOperation({ summary: '审批状态变更申请（通过/拒绝）' })
  async approveStatusChangeRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveStatusChangeRequestDto,
    @Headers('authorization') auth?: string,
  ) {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }
    const token = auth.replace('Bearer ', '');
    const user = await this.authService.getProfile(token);
    const approver = user.name || user.username;
    return this.animalsService.approveStatusChangeRequest(id, dto, approver, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取动物详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新动物信息' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimalDto: UpdateAnimalDto,
    @Headers('authorization') auth?: string,
  ) {
    const operator = await this.getOperatorFromToken(auth);
    return this.animalsService.update(id, updateAnimalDto, operator);
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

  @Get('status-flow/rules')
  @ApiOperation({ summary: '获取状态流转规则（有向图边列表）' })
  getStatusFlowRules() {
    return this.animalsService.getStatusFlowRules();
  }

  @Get(':id/status-logs')
  @ApiOperation({ summary: '获取单只动物的状态变更历史' })
  getStatusChangeLogs(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.getStatusChangeLogs(id);
  }

  @Patch(':id/parents')
  @ApiOperation({ summary: '设置动物的父母（亲代关系）' })
  async setParents(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetParentsDto,
  ) {
    return this.animalsService.setParents(id, dto);
  }

  @Get(':id/parents')
  @ApiOperation({ summary: '查询动物的父母' })
  getParents(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.getParents(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: '查询动物的所有子代' })
  getChildren(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.getChildren(id);
  }

  @Get(':id/ancestors/tree')
  @ApiOperation({ summary: '递归查询上溯N代祖先树' })
  @ApiQuery({ name: 'generations', required: false, description: '代數，默认3代' })
  getAncestorsTree(
    @Param('id', ParseIntPipe) id: number,
    @Query('generations') generations?: number,
  ) {
    const gen = generations ? Number(generations) : 3;
    return this.animalsService.getAncestorsTree(id, gen);
  }

  @Get(':id/descendants/tree')
  @ApiOperation({ summary: '递归查询下溯N代后代树' })
  @ApiQuery({ name: 'generations', required: false, description: '代數，默认3代' })
  getDescendantsTree(
    @Param('id', ParseIntPipe) id: number,
    @Query('generations') generations?: number,
  ) {
    const gen = generations ? Number(generations) : 3;
    return this.animalsService.getDescendantsTree(id, gen);
  }

  @Get(':id/pedigree')
  @ApiOperation({ summary: '获取完整谱系（祖先+后代）' })
  @ApiQuery({ name: 'generations', required: false, description: '代數，默认3代' })
  getFullPedigree(
    @Param('id', ParseIntPipe) id: number,
    @Query('generations') generations?: number,
  ) {
    const gen = generations ? Number(generations) : 3;
    return this.animalsService.getFullPedigree(id, gen);
  }

  @Get(':id/status-change-requests')
  @ApiOperation({ summary: '获取单只动物的状态变更申请列表' })
  getAnimalStatusChangeRequests(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.getStatusChangeRequestsByAnimal(id);
  }
}

@ApiTags('繁殖记录')
@Controller('breeding-records')
export class BreedingRecordsController {
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
  @ApiOperation({ summary: '创建繁殖记录' })
  async create(
    @Body() dto: CreateBreedingRecordDto,
    @Headers('authorization') auth?: string,
  ) {
    const operator = await this.getOperatorFromToken(auth);
    return this.animalsService.createBreedingRecord(dto, operator);
  }

  @Get()
  @ApiOperation({ summary: '查询繁殖记录列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('animalId') animalId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.animalsService.getBreedingRecords({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      animalId: animalId ? Number(animalId) : undefined,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取繁殖记录详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.getBreedingRecord(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新繁殖记录' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBreedingRecordDto,
    @Headers('authorization') auth?: string,
  ) {
    const operator = await this.getOperatorFromToken(auth);
    return this.animalsService.updateBreedingRecord(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除繁殖记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.deleteBreedingRecord(id);
  }
}
