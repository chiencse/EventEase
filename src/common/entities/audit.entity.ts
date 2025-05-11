import { CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

export abstract class AuditEntity {
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;
} 