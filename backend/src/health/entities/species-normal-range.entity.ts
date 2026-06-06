import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('species_normal_ranges')
export class SpeciesNormalRange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  species: string;

  @Column({ name: 'indicator_name', length: 50 })
  indicatorName: string;

  @Column({ name: 'min_value', type: 'decimal', precision: 10, scale: 2 })
  minValue: number;

  @Column({ name: 'max_value', type: 'decimal', precision: 10, scale: 2 })
  maxValue: number;

  @Column({ length: 20, nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
