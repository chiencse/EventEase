import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('revoked_tokens')
export class RevokedToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    token: string;

    @Column()
    type: 'access' | 'refresh';

    @Column()
    expiresAt: Date;

    @CreateDateColumn()
    revokedAt: Date;
} 