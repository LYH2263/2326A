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

@Entity('health_records')
export class HealthRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'check_date', type: 'date' })
  checkDate: Date;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ name: 'heart_rate', nullable: true })
  heartRate: number;

  @Column({ name: 'respiratory_rate', nullable: true })
  respiratoryRate: number;

  @Column({ type: 'enum', enum: ['normal', 'abnormal', 'critical'], default: 'normal' })
  condition: string;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ length: 100, nullable: true })
  veterinarian: string;

  @Column({ name: 'next_check_date', type: 'date', nullable: true })
  nextCheckDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, (animal) => animal.healthRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;
}
