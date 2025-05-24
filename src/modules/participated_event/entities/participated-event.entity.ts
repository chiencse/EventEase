import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../event/entities/event.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';
import { User } from '../../../modules/user/entities/user.entity';

@Entity('participated_events')
export class ParticipatedEvent extends AuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'event_id' })
  event: Event;
}