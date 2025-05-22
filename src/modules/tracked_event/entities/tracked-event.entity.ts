import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../event/entities/event.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';

@Entity('tracked_events')
export class TrackedEvent extends AuditEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'event_id' })
    eventId: number;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;
} 