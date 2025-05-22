import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from './event.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';

@Entity('image_events') // tên bảng
export class ImageEvent extends AuditEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column('text')
    imageUrl: string;

    @Column('text')
    fileName: string;

    @Column('text')
    fileType: string;

    @Column('text')
    fileSize: string;

    @Column({ name: 'is_main', default: false })
    isMain: boolean;
    
    @ManyToOne(() => Event, (event) => event.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId' }) // cột khóa ngoại trong bảng này
    event: Event;
}