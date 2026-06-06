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

@Entity('feeding_records')
export class FeedingRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'feed_date', type: 'date' })
  feedDate: Date;

  @Column({ name: 'feed_time', type: 'time', nullable: true })
  feedTime: string;

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

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, (animal) => animal.feedingRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;
}
