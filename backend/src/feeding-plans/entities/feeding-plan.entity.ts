import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';
import { FeedingTask } from './feeding-task.entity';

@Entity('feeding_plans')
export class FeedingPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plan_name', length: 200 })
  planName: string;

  @Column({ name: 'target_type', type: 'enum', enum: ['animal', 'cage'], default: 'animal' })
  targetType: string;

  @Column({ name: 'animal_id', nullable: true })
  animalId: number;

  @Column({ name: 'cage_number', length: 50, nullable: true })
  cageNumber: string;

  @Column({ name: 'food_type', length: 100 })
  foodType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity: number;

  @Column({ length: 20, default: 'g' })
  unit: string;

  @Column({ name: 'water_ml', type: 'decimal', precision: 10, scale: 2, nullable: true })
  waterMl: number;

  @Column({ name: 'feed_time', type: 'time' })
  feedTime: string;

  @Column({ name: 'repeat_type', type: 'enum', enum: ['daily', 'weekly', 'cron'], default: 'daily' })
  repeatType: string;

  @Column({ name: 'repeat_days', length: 50, nullable: true })
  repeatDays: string;

  @Column({ name: 'cron_expression', length: 100, nullable: true })
  cronExpression: string;

  @Column({ length: 100, nullable: true })
  feeder: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'enum', enum: ['active', 'paused', 'expired'], default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @OneToMany(() => FeedingTask, (task) => task.plan)
  tasks: FeedingTask[];
}
