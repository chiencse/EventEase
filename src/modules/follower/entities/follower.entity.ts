import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { AuditEntity } from 'src/common/entities/audit.entity';

@Unique(['user_1', 'user_2'])
@Entity('followers')
export class Follower extends AuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    user_1_id: string;

    // User_1: Người tạo mối quan hệ
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_1_id' })
    user_1: User;

    @Column()
    user_2_id: string;

    // User_2: Người được theo dõi
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_2_id' })
    user_2: User;

    // User_1 có đang theo dõi User_2 hay không
    @Column({ default: false })
    isFollow: boolean;

    // User_2 có đang theo dõi lại User_1 hay không
    @Column({ default: false })
    isFollowed: boolean;
}
