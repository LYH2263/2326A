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
import { HealthRecord } from '../../health/entities/health-record.entity';

@Entity('checkup_schedules')
export class CheckupSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: Date;

  @Column({ name: 'time_slot', type: 'enum', enum: ['morning', 'afternoon'], default: 'morning' })
  timeSlot: string;

  @Column({ length: 100, nullable: true })
  veterinarian: string;

  @Column({ name: 'check_type', type: 'enum', enum: ['routine', 'pre_experiment', 'post_treatment', 'follow_up'], default: 'routine' })
  checkType: string;

  @Column({ type: 'enum', enum: ['normal', 'high', 'urgent'], default: 'normal' })
  priority: string;

  @Column({ type: 'enum', enum: ['scheduled', 'completed', 'missed', 'cancelled'], default: 'scheduled' })
  status: string;

  @Column({ name: 'health_record_id', nullable: true })
  healthRecordId: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Animal, (animal) => animal.checkupSchedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @ManyToOne(() => HealthRecord, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'health_record_id' })
  healthRecord: HealthRecord;
}
