import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from './animal.entity';

@Entity('status_change_logs')
export class StatusChangeLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @ManyToOne(() => Animal, (animal) => animal.statusChangeLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @Column({ name: 'from_status', length: 50 })
  fromStatus: string;

  @Column({ name: 'to_status', length: 50 })
  toStatus: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ length: 100, nullable: true })
  operator: string;

  @Column({ name: 'experiment_id', type: 'int', nullable: true })
  experimentId: number;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
