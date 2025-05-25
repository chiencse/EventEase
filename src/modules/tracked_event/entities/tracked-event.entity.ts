import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../event/entities/event.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';
import { User } from '../../user/entities/user.entity';
@Entity('tracked_events')
export class TrackedEvent extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
} 