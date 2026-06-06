import { Injectable, Logger } from '@nestjs/common';
import { AnimalsService } from '../animals/animals.service';
import { HealthService } from '../health/health.service';
import { ExperimentsService } from '../experiments/experiments.service';
import { FeedingService } from '../feeding/feeding.service';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly animalsService: AnimalsService,
    private readonly healthService: HealthService,
    private readonly experimentsService: ExperimentsService,
    private readonly feedingService: FeedingService,
  ) {}

  async getOverview() {
    const [animalCount, animalsByStatus, animalsBySpecies, experimentsByStatus, healthByCondition] =
      await Promise.all([
        this.animalsService.count(),
        this.animalsService.countByStatus(),
        this.animalsService.countBySpecies(),
        this.experimentsService.countByStatus(),
        this.healthService.countByCondition(),
      ]);

    this.logger.log('Generated statistics overview');

    return {
      animalCount,
      animalsByStatus,
      animalsBySpecies,
      experimentsByStatus,
      healthByCondition,
    };
  }

  async getAnimalStatistics() {
    const [byStatus, bySpecies] = await Promise.all([
      this.animalsService.countByStatus(),
      this.animalsService.countBySpecies(),
    ]);

    return { byStatus, bySpecies };
  }

  async getExperimentStatistics() {
    const [byStatus, byDepartment] = await Promise.all([
      this.experimentsService.countByStatus(),
      this.experimentsService.countByDepartment(),
    ]);

    return { byStatus, byDepartment };
  }

  async getFeedingStatistics() {
    const dailySummary = await this.feedingService.getDailyFeedingSummary();
    return { dailySummary };
  }
}
