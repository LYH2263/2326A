import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AnimalsModule } from './animals/animals.module';
import { HealthModule } from './health/health.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { FeedingModule } from './feeding/feeding.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'root123456',
      database: process.env.DB_DATABASE || 'lab_animal_db',
      autoLoadEntities: true,
      synchronize: false,
      charset: 'utf8mb4',
      logging: false,
      extra: {
        connectionLimit: 10,
      },
    }),
    AuthModule,
    AnimalsModule,
    HealthModule,
    ExperimentsModule,
    FeedingModule,
    StatisticsModule,
  ],
})
export class AppModule {}
