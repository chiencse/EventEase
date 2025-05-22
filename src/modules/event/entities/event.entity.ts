// src/modules/event/entities/event.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ImageEvent } from './image-event.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';
import { EventHashtag } from './event-hashtag.entity';
@Entity('events') // tên bảng`
export class Event extends AuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column()
  participantNumber: number;

  @Column()
  position: string;

  // Quan hệ: 1 Event có nhiều ảnh
  @OneToMany(() => ImageEvent, (image) => image.event, { cascade: true })
  images: ImageEvent[];

  @OneToMany(() => EventHashtag, (eventHashtag) => eventHashtag.event, { cascade: true })
  eventHashtags: EventHashtag[];
}
  