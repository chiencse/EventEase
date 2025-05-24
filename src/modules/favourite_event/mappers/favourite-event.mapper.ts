import { FavouriteEvent } from '../entities/favourite-event.entity';
import { EventFavouriteResponseDto, UserFavouriteEventsResponseDto } from '../dto/favourite-event-response.dto';

export class FavouriteEventMapper {
    /**
     * Chuyển đổi 1 đối tượng FavouriteEvent thành định dạng DTO trả về cho client
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy thông tin chi tiết của 1 bản ghi yêu thích sự kiện
     * - Ví dụ: Khi người dùng thêm sự kiện vào danh sách yêu thích, trả về thông tin xác nhận
     * - Hoặc khi cần kiểm tra trạng thái yêu thích của 1 người trong 1 sự kiện
     * 
     * @param favouriteEvent - Đối tượng FavouriteEvent
     * @returns EventFavouriteResponseDto hoặc null
     */
    static toResponseDto(favouriteEvent: FavouriteEvent): EventFavouriteResponseDto | null {
        if (!favouriteEvent) return null;

        const response = new EventFavouriteResponseDto();
        response.id = favouriteEvent.id;
        response.createdAt = favouriteEvent.createdAt;

        if (favouriteEvent.event) {
            response.event = {
                id: favouriteEvent.event.id,
                title: favouriteEvent.event.title,
                startTime: favouriteEvent.event.startTime,
                endTime: favouriteEvent.event.endTime,
                position: favouriteEvent.event.position,
                participantNumber: favouriteEvent.event.participantNumber,
                imagesMain: favouriteEvent.event.images?.find(img => img.isMain)?.imageUrl || '',
                createdBy: favouriteEvent.event.createdBy
            };
        }

        if (favouriteEvent.user) {
            response.users = [{
                id: favouriteEvent.user.id,
                firstName: favouriteEvent.user.firstName,
                lastName: favouriteEvent.user.lastName,
                avatar: favouriteEvent.user.avatar
            }];
        }

        return response;
    }

    /**
     * Gộp danh sách FavouriteEvent của một sự kiện thành một DTO
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy danh sách tất cả người yêu thích của 1 sự kiện
     * - Ví dụ: Hiển thị danh sách người yêu thích trong trang chi tiết sự kiện
     * - Hoặc khi cần thống kê số lượng người yêu thích sự kiện
     * 
     * @param favouriteEvents - Danh sách FavouriteEvent của một sự kiện
     * @returns EventFavouriteResponseDto hoặc null
     */
    static toEventFavouritesDto(favouriteEvents: FavouriteEvent[]): EventFavouriteResponseDto | null {
        if (!favouriteEvents?.length) return null;

        const first = favouriteEvents[0];
        const response = new EventFavouriteResponseDto();
        response.id = first.id;
        response.createdAt = first.createdAt;

        if (first.event) {
            response.event = {
                id: first.event.id,
                title: first.event.title,
                startTime: first.event.startTime,
                endTime: first.event.endTime,
                position: first.event.position,
                participantNumber: first.event.participantNumber,
                imagesMain: first.event.images?.find(img => img.isMain)?.imageUrl || '',
                createdBy: first.event.createdBy
            };
        }

        response.users = favouriteEvents
            .map(fe => fe.user)
            .filter(Boolean)
            .map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
            }));

        return response;
    }

    /**
     * Gộp danh sách FavouriteEvent của một người dùng thành một DTO
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy danh sách tất cả sự kiện mà 1 người dùng đã yêu thích
     * - Ví dụ: Hiển thị danh sách sự kiện yêu thích trong trang profile người dùng
     * - Hoặc khi cần thống kê lịch sử yêu thích sự kiện của người dùng
     * 
     * @param favouriteEvents - Danh sách FavouriteEvent của một người dùng
     * @returns UserFavouriteEventsResponseDto hoặc null
     */
    static toUserEventsDto(favouriteEvents: FavouriteEvent[]): UserFavouriteEventsResponseDto | null {
        if (!favouriteEvents?.length) return null;

        const first = favouriteEvents[0];
        const response = new UserFavouriteEventsResponseDto();
        response.createdAt = first.createdAt;

        if (first.user) {
            response.user = {
                id: first.user.id,
                firstName: first.user.firstName,
                lastName: first.user.lastName,
                avatar: first.user.avatar
            };
        }

        response.events = favouriteEvents
            .filter(fe => fe.event)
            .map(fe => ({
                id: fe.id,
                eventId: fe.event.id,
                title: fe.event.title,
                startTime: fe.event.startTime,
                endTime: fe.event.endTime,
                position: fe.event.position,
                participantNumber: fe.event.participantNumber,
                imagesMain: fe.event.images?.find(img => img.isMain)?.imageUrl || '',
                createdAt: fe.event.createdAt,
                createdBy: fe.event.createdBy
            }));

        return response;
    }
} 