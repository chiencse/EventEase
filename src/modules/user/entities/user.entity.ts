import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { AuditEntity } from 'src/common/entities/audit.entity';

@Entity('users')
export class User extends AuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', length: 50 })
  lastName: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  location: string;

  @Column({ name: 'phone_number', unique: true, length: 20, nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;
}
