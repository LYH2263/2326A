import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';

@Entity('cage_transfer_logs')
export class CageTransferLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @ManyToOne(() => Animal, (animal) => animal.cageTransferLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @Column({ name: 'from_cage', length: 50, nullable: true })
  fromCage: string;

  @Column({ name: 'to_cage', length: 50, nullable: true })
  toCage: string;

  @Column({
    type: 'enum',
    enum: ['move_in', 'move_out', 'cage_split', 'cage_merge'],
  })
  operationType: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'operator', length: 100, nullable: true })
  operator: string;

  @CreateDateColumn({ name: 'operated_at' })
  operatedAt: Date;
}
