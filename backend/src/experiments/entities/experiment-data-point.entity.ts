import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Experiment } from './experiment.entity';
import { Animal } from '../../animals/entities/animal.entity';

@Entity('experiment_data_points')
export class ExperimentDataPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'experiment_id' })
  experimentId: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'collected_at', type: 'datetime' })
  collectedAt: Date;

  @Column({ name: 'metric_name', length: 100 })
  metricName: string;

  @Column({
    type: 'enum',
    enum: ['numeric', 'text', 'option'],
    default: 'numeric',
  })
  dataType: string;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  numericValue: number;

  @Column({ type: 'text', nullable: true })
  textValue: string;

  @Column({ length: 100, nullable: true })
  optionValue: string;

  @Column({ length: 30, nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Experiment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experiment_id' })
  experiment: Experiment;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;
}
