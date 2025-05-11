import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../event/entities/event.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';

@Entity('participated_events')
export class ParticipatedEvent extends AuditEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'event_id' })
    eventId: number;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: Event;
} 