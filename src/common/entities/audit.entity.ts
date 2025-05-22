import { CreateDateColumn, UpdateDateColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';

/**
 * Entity cơ sở cho việc theo dõi thời gian tạo/cập nhật và người tạo/cập nhật
 * Các entity khác kế thừa từ class này sẽ tự động có các trường:
 * - createdAt: Thời gian tạo
 * - createdBy: ID người tạo
 * - updatedAt: Thời gian cập nhật
 * - updatedBy: ID người cập nhật
 */
export abstract class AuditEntity {
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @Column({ name: 'created_by', nullable: true, type: 'text' })
    createdBy: string;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Column({ name: 'updated_by', nullable: true, type: 'text' })
    updatedBy: string;

    /**
     * Hook tự động chạy trước khi insert
     * Lấy user ID từ request và set vào createdBy/updatedBy
     */
    @BeforeInsert()
    setCreatedBy() {
        const request = (global as any).request;
        const userId = request?.user?.id;
        if (userId) {
            this.createdBy = userId;
            this.updatedBy = userId;
        }
    }

    /**
     * Hook tự động chạy trước khi update
     * Lấy user ID từ request và set vào updatedBy
     */
    @BeforeUpdate()
    setUpdatedBy() {
        const request = (global as any).request;
        const userId = request?.user?.id;
        if (userId) {
            this.updatedBy = userId;
        }
    }
} 