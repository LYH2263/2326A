import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedingController } from './feeding.controller';
import { FeedingService } from './feeding.service';
import { FeedingRecord } from './entities/feeding-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeedingRecord])],
  controllers: [FeedingController],
  providers: [FeedingService],
  exports: [FeedingService],
})
export class FeedingModule {}
