import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { HealthRecord } from '../../health/entities/health-record.entity';
import { ExperimentAnimal } from '../../experiments/entities/experiment-animal.entity';
import { FeedingRecord } from '../../feeding/entities/feeding-record.entity';

@Entity('animals')
export class Animal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  species: string;

  @Column({ length: 50, nullable: true })
  breed: string;

  @Column({ type: 'enum', enum: ['male', 'female', 'unknown'], default: 'unknown' })
  gender: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({
    type: 'enum',
    enum: ['healthy', 'sick', 'in_experiment', 'deceased', 'quarantine'],
    default: 'healthy',
  })
  status: string;

  @Column({ name: 'cage_number', length: 50, nullable: true })
  cageNumber: string;

  @Column({ name: 'rfid_tag', length: 100, nullable: true })
  rfidTag: string;

  @Column({ length: 200, nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => HealthRecord, (record) => record.animal)
  healthRecords: HealthRecord[];

  @OneToMany(() => ExperimentAnimal, (ea) => ea.animal)
  experimentAnimals: ExperimentAnimal[];

  @OneToMany(() => FeedingRecord, (record) => record.animal)
  feedingRecords: FeedingRecord[];
}
