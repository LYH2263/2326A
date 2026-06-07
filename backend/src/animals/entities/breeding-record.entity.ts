import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Animal } from './animal.entity';

@Entity('breeding_records')
export class BreedingRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'male_id', type: 'int' })
  maleId: number;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'male_id' })
  male: Animal;

  @Column({ name: 'female_id', type: 'int' })
  femaleId: number;

  @ManyToOne(() => Animal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'female_id' })
  female: Animal;

  @Column({ name: 'pairing_date', type: 'date' })
  pairingDate: Date;

  @Column({ name: 'expected_birth_date', type: 'date', nullable: true })
  expectedBirthDate: Date;

  @Column({ name: 'actual_birth_date', type: 'date', nullable: true })
  actualBirthDate: Date;

  @Column({ name: 'litter_count', type: 'int', nullable: true })
  litterCount: number;

  @Column({ name: 'survival_count', type: 'int', nullable: true })
  survivalCount: number;

  @Column({ name: 'male_count', type: 'int', nullable: true })
  maleCount: number;

  @Column({ name: 'female_count', type: 'int', nullable: true })
  femaleCount: number;

  @Column({
    type: 'enum',
    enum: ['planned', 'pairing', 'pregnant', 'birthed', 'weaned', 'failed'],
    default: 'planned',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 100, nullable: true })
  operator: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
