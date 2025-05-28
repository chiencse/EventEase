import { Follower } from '../entities/follower.entity';
import { FollowerResponseDto } from '../dto/follower-response.dto';

export class FollowerMapper {
    /**
     * Chuyển đổi 1 đối tượng Follower thành định dạng DTO trả về cho client
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy thông tin chi tiết của 1 bản ghi theo dõi
     * - Ví dụ: Khi người dùng tạo mối quan hệ mới, trả về thông tin xác nhận
     * - Hoặc khi cần kiểm tra quan hệ của người dùng với người khác
     * 
     * @param follower - Đối tượng Follower cần chuyển đổi
     * @returns FollowerResponseDto hoặc null
     */
    static toResponseDto(follower: Follower): FollowerResponseDto | null {
        if (!follower) return null;

        const response = new FollowerResponseDto();
        response.id = follower.id;
        response.isFollow = follower.isFollow;
        response.isFollowed = follower.isFollowed;
        response.createdAt = follower.createdAt;

        if (follower.user_1) {
            response.user_1 = {
                id: follower.user_1.id,
                firstName: follower.user_1.firstName,
                lastName: follower.user_1.lastName,
                avatar: follower.user_1.avatar,
            };
        }

        if (follower.user_2) {
            response.user_2 = {
                id: follower.user_2.id,
                firstName: follower.user_2.firstName,
                lastName: follower.user_2.lastName,
                avatar: follower.user_2.avatar
            };
        }

        return response;
    }
} 