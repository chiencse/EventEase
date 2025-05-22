import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Event } from './event.entity';
import { Hashtag } from './hashtag.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';

@Entity('event_hashtags')
export class EventHashtag extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Event, event => event.eventHashtags, { onDelete: 'CASCADE' })
    event: Event;

    @ManyToOne(() => Hashtag, hashtag => hashtag.eventHashtags, { onDelete: 'CASCADE' })
    hashtag: Hashtag;
} 