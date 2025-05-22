import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EventHashtag } from './event-hashtag.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';

@Entity('hashtags')
export class Hashtag extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ default: 0 })
    usageCount: number;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => EventHashtag, eventHashtag => eventHashtag.hashtag)
    eventHashtags: EventHashtag[];
} 