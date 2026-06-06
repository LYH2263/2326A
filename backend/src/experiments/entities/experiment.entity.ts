import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ExperimentAnimal } from './experiment-animal.entity';

@Entity('experiments')
export class Experiment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'project_code', length: 50, unique: true })
  projectCode: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ['planning', 'in_progress', 'completed', 'suspended', 'cancelled'],
    default: 'planning',
  })
  status: string;

  @Column({ length: 100, nullable: true })
  researcher: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ExperimentAnimal, (ea) => ea.experiment)
  experimentAnimals: ExperimentAnimal[];
}
