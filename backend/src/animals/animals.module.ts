import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalsController, BreedingRecordsController } from './animals.controller';
import { AnimalsService } from './animals.service';
import { Animal } from './entities/animal.entity';
import { CageTransferLog } from './entities/cage-transfer-log.entity';
import { StatusChangeLog } from './entities/status-change-log.entity';
import { BreedingRecord } from './entities/breeding-record.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Animal, CageTransferLog, StatusChangeLog, BreedingRecord]), AuthModule],
  controllers: [AnimalsController, BreedingRecordsController],
  providers: [AnimalsService],
  exports: [AnimalsService],
})
export class AnimalsModule {}
