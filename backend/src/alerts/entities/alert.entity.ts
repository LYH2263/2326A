import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';

export type AlertType = 'health_abnormal' | 'next_check_overdue' | 'no_feeding_record';
export type AlertLevel = 'warning' | 'danger' | 'info';
export type AlertStatus = 'unread' | 'read' | 'resolved';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  @Index()
  animalId: number;

  @Column({
    type: 'enum',
    enum: ['health_abnormal', 'next_check_overdue', 'no_feeding_record'],
  })
  @Index()
  type: AlertType;

  @Column({
    type: 'enum',
    enum: ['warning', 'danger', 'info'],
    default: 'warning',
  })
  level: AlertLevel;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: ['unread', 'read', 'resolved'],
    default: 'unread',
  })
  @Index()
  status: AlertStatus;

  @Column({ name: 'related_record_id', nullable: true })
  relatedRecordId: number;

  @Column({ name: 'related_record_type', length: 50, nullable: true })
  relatedRecordType: string;

  @Column({ name: 'triggered_at', type: 'datetime', nullable: true })
  triggeredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;
}
