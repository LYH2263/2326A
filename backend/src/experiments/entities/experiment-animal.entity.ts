import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Experiment } from './experiment.entity';
import { Animal } from '../../animals/entities/animal.entity';

@Entity('experiment_animals')
export class ExperimentAnimal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'experiment_id' })
  experimentId: number;

  @Column({ name: 'animal_id' })
  animalId: number;

  @Column({ length: 50, default: 'subject' })
  role: string;

  @Column({ name: 'join_date', type: 'date', nullable: true })
  joinDate: Date;

  @Column({ name: 'leave_date', type: 'date', nullable: true })
  leaveDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Experiment, (experiment) => experiment.experimentAnimals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experiment_id' })
  experiment: Experiment;

  @ManyToOne(() => Animal, (animal) => animal.experimentAnimals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;
}
