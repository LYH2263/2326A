import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from './animal.entity';

@Entity('status_change_requests')
export class StatusChangeRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'applicant', length: 100 })
  applicant: string;

  @Column({ name: 'animal_id' })
  animalId: number;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @Column({ name: 'from_status', length: 50 })
  fromStatus: string;

  @Column({ name: 'to_status', length: 50 })
  toStatus: string;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @Column({ name: 'approver', type: 'varchar', length: 100, nullable: true })
  approver: string | null;

  @Column({
    name: 'approval_status', type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  approvalStatus: string;

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt: Date | null;
}
