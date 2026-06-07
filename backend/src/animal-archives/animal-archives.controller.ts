import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AnimalArchivesService } from './animal-archives.service';
import dayjs from 'dayjs';

export class BatchExportDto {
  ids: number[];
}

@ApiTags('动物档案导出')
@Controller('animal-archives')
export class AnimalArchivesController {
  constructor(private readonly animalArchivesService: AnimalArchivesService) {}

  @Get(':id')
  @ApiOperation({ summary: '获取单只动物完整档案' })
  async getAnimalArchive(@Param('id', ParseIntPipe) id: number) {
    return this.animalArchivesService.getAnimalArchive(id);
  }

  @Get(':id/export/word')
  @ApiOperation({ summary: '导出单只动物档案为Word文档' })
  async exportWord(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const archive = await this.animalArchivesService.getAnimalArchive(id);
    const buffer = await this.animalArchivesService.generateWordDocument(archive);

    const fileName = `${archive.basicInfo.name}_动物档案.docx`;
    const safeFileName = this.animalArchivesService.getSafeFileName(fileName);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFileName)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Post('batch/export/zip')
  @ApiOperation({ summary: '批量导出动物档案为ZIP压缩包' })
  @ApiBody({ schema: { properties: { ids: { type: 'array', items: { type: 'number' } } } } })
  async batchExportZip(
    @Body() dto: BatchExportDto,
    @Res() res: Response,
  ) {
    const { ids } = dto;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('请提供有效的动物ID列表');
    }

    const archives = await this.animalArchivesService.getBatchAnimalArchives(ids);
    const buffer = await this.animalArchivesService.generateZipArchive(archives);

    const dateStr = dayjs().format('YYYYMMDD_HHmmss');
    const fileName = `动物档案批量导出_${dateStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
