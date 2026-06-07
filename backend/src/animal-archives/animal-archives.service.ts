import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Animal } from '../animals/entities/animal.entity';
import { HealthRecord } from '../health/entities/health-record.entity';
import { FeedingRecord } from '../feeding/entities/feeding-record.entity';
import { ExperimentAnimal } from '../experiments/entities/experiment-animal.entity';
import { Experiment } from '../experiments/entities/experiment.entity';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
} from 'docx';
import * as archiver from 'archiver';
import { Readable } from 'stream';
import * as dayjs from 'dayjs';

export interface AnimalArchive {
  basicInfo: Animal;
  healthRecords: HealthRecord[];
  feedingRecords: FeedingRecord[];
  experiments: (Experiment & { role?: string; joinDate?: Date; leaveDate?: Date; notes?: string })[];
}

@Injectable()
export class AnimalArchivesService {
  private readonly logger = new Logger(AnimalArchivesService.name);

  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(HealthRecord)
    private readonly healthRecordRepository: Repository<HealthRecord>,
    @InjectRepository(FeedingRecord)
    private readonly feedingRecordRepository: Repository<FeedingRecord>,
    @InjectRepository(ExperimentAnimal)
    private readonly experimentAnimalRepository: Repository<ExperimentAnimal>,
    @InjectRepository(Experiment)
    private readonly experimentRepository: Repository<Experiment>,
  ) {}

  async getAnimalArchive(id: number): Promise<AnimalArchive> {
    const animal = await this.animalRepository.findOne({
      where: { id },
      relations: ['father', 'mother'],
    });
    if (!animal) {
      throw new NotFoundException(`动物 #${id} 不存在`);
    }

    const [healthRecords, feedingRecords, experimentAnimals] = await Promise.all([
      this.healthRecordRepository.find({
        where: { animalId: id },
        order: { checkDate: 'DESC' },
      }),
      this.feedingRecordRepository.find({
        where: { animalId: id },
        order: { feedDate: 'DESC', feedTime: 'DESC' },
      }),
      this.experimentAnimalRepository.find({
        where: { animalId: id },
        relations: ['experiment'],
        order: { joinDate: 'DESC' },
      }),
    ]);

    const experiments = experimentAnimals.map((ea) => ({
      ...ea.experiment,
      role: ea.role,
      joinDate: ea.joinDate,
      leaveDate: ea.leaveDate,
      notes: ea.notes,
    }));

    return {
      basicInfo: animal,
      healthRecords,
      feedingRecords,
      experiments,
    };
  }

  async getBatchAnimalArchives(ids: number[]): Promise<AnimalArchive[]> {
    const archives: AnimalArchive[] = [];
    for (const id of ids) {
      try {
        const archive = await this.getAnimalArchive(id);
        archives.push(archive);
      } catch (e) {
        this.logger.warn(`跳过动物 #${id}: ${e.message}`);
      }
    }
    return archives;
  }

  async generateWordDocument(archive: AnimalArchive): Promise<Buffer> {
    const { basicInfo, healthRecords, feedingRecords, experiments } = archive;

    const formatDate = (date: Date | string | null | undefined): string => {
      if (!date) return '-';
      return dayjs(date).format('YYYY-MM-DD');
    };

    const formatDateTime = (date: Date | string | null | undefined): string => {
      if (!date) return '-';
      return dayjs(date).format('YYYY-MM-DD HH:mm');
    };

    const statusLabels: Record<string, string> = {
      healthy: '健康',
      sick: '患病',
      in_experiment: '实验中',
      deceased: '已死亡',
      quarantine: '隔离中',
    };

    const genderLabels: Record<string, string> = {
      male: '雄性',
      female: '雌性',
      unknown: '未知',
    };

    const tableBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    };

    const createTableCell = (text: string, isHeader = false): TableCell => {
      return new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: isHeader,
                size: 20,
              }),
            ],
            spacing: { before: 60, after: 60 },
          }),
        ],
        borders: tableBorder,
        width: isHeader ? { size: 20, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: 'center',
      });
    };

    const children: (Paragraph | Table | PageBreak)[] = [];

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${basicInfo.name} - 动物档案`,
            bold: true,
            size: 36,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `生成时间：${formatDateTime(new Date())}`,
            size: 20,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '一、基本信息',
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
      }),
    );

    const basicInfoRows: TableRow[] = [
      new TableRow({
        children: [
          createTableCell('编号', true),
          createTableCell(basicInfo.name || '-'),
          createTableCell('物种', true),
          createTableCell(basicInfo.species || '-'),
        ],
      }),
      new TableRow({
        children: [
          createTableCell('品系', true),
          createTableCell(basicInfo.breed || '-'),
          createTableCell('性别', true),
          createTableCell(genderLabels[basicInfo.gender] || basicInfo.gender || '-'),
        ],
      }),
      new TableRow({
        children: [
          createTableCell('出生日期', true),
          createTableCell(formatDate(basicInfo.birthDate)),
          createTableCell('体重', true),
          createTableCell(basicInfo.weight ? `${basicInfo.weight}g` : '-'),
        ],
      }),
      new TableRow({
        children: [
          createTableCell('状态', true),
          createTableCell(statusLabels[basicInfo.status] || basicInfo.status || '-'),
          createTableCell('笼号', true),
          createTableCell(basicInfo.cageNumber || '-'),
        ],
      }),
      new TableRow({
        children: [
          createTableCell('RFID标签', true),
          createTableCell(basicInfo.rfidTag || '-'),
          createTableCell('来源', true),
          createTableCell(basicInfo.source || '-'),
        ],
      }),
      new TableRow({
        children: [
          createTableCell('父亲编号', true),
          createTableCell(basicInfo.father?.name || '-'),
          createTableCell('母亲编号', true),
          createTableCell(basicInfo.mother?.name || '-'),
        ],
      }),
    ];

    children.push(
      new Table({
        rows: basicInfoRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );

    if (basicInfo.description) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `备注：${basicInfo.description}`,
              size: 20,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '二、健康记录',
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );

    if (healthRecords.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '暂无健康记录',
              size: 20,
              color: '999999',
            }),
          ],
        }),
      );
    } else {
      const conditionLabels: Record<string, string> = {
        normal: '正常',
        abnormal: '异常',
        critical: '危重',
      };

      const healthHeaderRow = new TableRow({
        children: [
          createTableCell('检查日期', true),
          createTableCell('体温(℃)', true),
          createTableCell('体重(g)', true),
          createTableCell('心率(次/分)', true),
          createTableCell('呼吸(次/分)', true),
          createTableCell('状况', true),
          createTableCell('诊断', true),
          createTableCell('兽医', true),
        ],
      });

      const healthDataRows = healthRecords.map((record) =>
        new TableRow({
          children: [
            createTableCell(formatDate(record.checkDate)),
            createTableCell(record.temperature ? String(record.temperature) : '-'),
            createTableCell(record.weight ? String(record.weight) : '-'),
            createTableCell(record.heartRate ? String(record.heartRate) : '-'),
            createTableCell(record.respiratoryRate ? String(record.respiratoryRate) : '-'),
            createTableCell(conditionLabels[record.condition] || record.condition || '-'),
            createTableCell(record.diagnosis || '-'),
            createTableCell(record.veterinarian || '-'),
          ],
        }),
      );

      children.push(
        new Table({
          rows: [healthHeaderRow, ...healthDataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
    }

    children.push(
      new PageBreak(),
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '三、饲养记录',
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
      }),
    );

    if (feedingRecords.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '暂无饲养记录',
              size: 20,
              color: '999999',
            }),
          ],
        }),
      );
    } else {
      const feedingHeaderRow = new TableRow({
        children: [
          createTableCell('日期', true),
          createTableCell('时间', true),
          createTableCell('饲料类型', true),
          createTableCell('数量', true),
          createTableCell('饮水量(ml)', true),
          createTableCell('饲喂员', true),
        ],
      });

      const feedingDataRows = feedingRecords.map((record) =>
        new TableRow({
          children: [
            createTableCell(formatDate(record.feedDate)),
            createTableCell(record.feedTime || '-'),
            createTableCell(record.foodType || '-'),
            createTableCell(record.quantity ? `${record.quantity}${record.unit || 'g'}` : '-'),
            createTableCell(record.waterMl ? String(record.waterMl) : '-'),
            createTableCell(record.feeder || '-'),
          ],
        }),
      );

      children.push(
        new Table({
          rows: [feedingHeaderRow, ...feedingDataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '四、参与实验',
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
    );

    if (experiments.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '暂无参与实验',
              size: 20,
              color: '999999',
            }),
          ],
        }),
      );
    } else {
      const experimentStatusLabels: Record<string, string> = {
        planning: '规划中',
        in_progress: '进行中',
        completed: '已完成',
        suspended: '已暂停',
        cancelled: '已取消',
      };

      const expHeaderRow = new TableRow({
        children: [
          createTableCell('实验名称', true),
          createTableCell('项目编号', true),
          createTableCell('角色', true),
          createTableCell('加入日期', true),
          createTableCell('退出日期', true),
          createTableCell('状态', true),
        ],
      });

      const expDataRows = experiments.map((exp) =>
        new TableRow({
          children: [
            createTableCell(exp.name || '-'),
            createTableCell(exp.projectCode || '-'),
            createTableCell(exp.role || '-'),
            createTableCell(formatDate(exp.joinDate)),
            createTableCell(formatDate(exp.leaveDate)),
            createTableCell(experimentStatusLabels[exp.status] || exp.status || '-'),
          ],
        }),
      );

      children.push(
        new Table({
          rows: [expHeaderRow, ...expDataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  async generateZipArchive(archives: AnimalArchive[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      const chunks: Buffer[] = [];

      const stream = new Readable({
        read() {},
      });

      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      const addFiles = async () => {
        for (const arc of archives) {
          const fileName = `${arc.basicInfo.name}_动物档案.docx`;
          const docBuffer = await this.generateWordDocument(arc);
          archive.append(docBuffer, { name: fileName });
        }
        archive.finalize();
      };

      addFiles().catch(reject);
    });
  }

  getSafeFileName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_');
  }
}
