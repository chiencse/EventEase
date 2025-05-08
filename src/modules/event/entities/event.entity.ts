// src/modules/event/entities/event.entity.ts
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('events') // tên bảng
  export class Event {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    title: string;
  
    @Column('text')
    description: string;
  
    @Column({ type: 'timestamp' })
    startTime: Date;
  
    @Column({ type: 'timestamp' })
    endTime: Date;
  
    @Column()
    tag: string;
  
    @Column({ type: 'int' })
    participantNumber: number;
  
    @Column()
    position: string;
  
    @Column({ type: 'int' })
    createdBy: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @Column({ type: 'int', nullable: true })
    updatedBy: number;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  