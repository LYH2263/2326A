import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';
import { FeedingPlan } from './feeding-plan.entity';
import { FeedingRecord } from '../../feeding/entities/feeding-record.entity';

@Entity('feeding_tasks')
export class FeedingTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_id', nullable: true })
  planId: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'task_date', type: 'date' })
  taskDate: Date;

  @Column({ name: 'task_time', type: 'time' })
  taskTime: string;

  @Column({ name: 'food_type', length: 100 })
  foodType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity: number;

  @Column({ length: 20, default: 'g' })
  unit: string;

  @Column({ name: 'water_ml', type: 'decimal', precision: 10, scale: 2, nullable: true })
  waterMl: number;

  @Column({ length: 100, nullable: true })
  feeder: string;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'missed', 'cancelled'], default: 'pending' })
  status: string;

  @Column({ name: 'feeding_record_id', nullable: true })
  feedingRecordId: number;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => FeedingPlan, (plan) => plan.tasks, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: FeedingPlan;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @ManyToOne(() => FeedingRecord, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'feeding_record_id' })
  feedingRecord: FeedingRecord;
}
