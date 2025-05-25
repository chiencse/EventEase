import { TrackedEvent } from '../entities/tracked-event.entity';
import { EventTrackedResponseDto, UserTrackedEventsResponseDto } from '../dto/tracked-event-response.dto';

export class TrackedEventMapper {
    /**
     * Chuyển đổi 1 đối tượng TrackedEvent thành định dạng DTO trả về cho client
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy thông tin chi tiết của 1 bản ghi theo dõi sự kiện
     * - Ví dụ: Khi người dùng theo dõi sự kiện, trả về thông tin xác nhận
     * - Hoặc khi cần kiểm tra trạng thái theo dõi của 1 người trong 1 sự kiện
     * 
     * @param trackedEvent - Đối tượng TrackedEvent
     * @returns EventTrackedResponseDto hoặc null
     */
    static toResponseDto(trackedEvent: TrackedEvent): EventTrackedResponseDto | null {
        if (!trackedEvent) return null;

        const response = new EventTrackedResponseDto();
        response.id = trackedEvent.id;
        response.createdAt = trackedEvent.createdAt;

        if (trackedEvent.event) {
            response.event = {
                id: trackedEvent.event.id,
                title: trackedEvent.event.title,
                startTime: trackedEvent.event.startTime,
                endTime: trackedEvent.event.endTime,
                position: trackedEvent.event.position,
                participantNumber: trackedEvent.event.participantNumber,
                imagesMain: trackedEvent.event.images?.find(img => img.isMain)?.imageUrl || '',
                createdBy: trackedEvent.event.createdBy
            };
        }

        if (trackedEvent.user) {
            response.users = [{
                id: trackedEvent.user.id,
                firstName: trackedEvent.user.firstName,
                lastName: trackedEvent.user.lastName,
                avatar: trackedEvent.user.avatar
            }];
        }

        return response;
    }

    /**
     * Gộp danh sách TrackedEvent của một sự kiện thành một DTO
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy danh sách tất cả người theo dõi của 1 sự kiện
     * - Ví dụ: Hiển thị danh sách người theo dõi trong trang chi tiết sự kiện
     * - Hoặc khi cần thống kê số lượng người theo dõi sự kiện
     * 
     * @param trackedEvents - Danh sách TrackedEvent của một sự kiện
     * @returns EventTrackedResponseDto hoặc null
     */
    static toEventTrackedDto(trackedEvents: TrackedEvent[]): EventTrackedResponseDto | null {
        if (!trackedEvents?.length) return null;

        const first = trackedEvents[0];
        const response = new EventTrackedResponseDto();
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

        response.users = trackedEvents
            .map(te => te.user)
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
     * Gộp danh sách TrackedEvent của một người dùng thành một DTO
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy danh sách tất cả sự kiện mà 1 người dùng đang theo dõi
     * - Ví dụ: Hiển thị danh sách sự kiện đang theo dõi trong trang profile người dùng
     * - Hoặc khi cần thống kê lịch sử theo dõi sự kiện của người dùng
     * 
     * @param trackedEvents - Danh sách TrackedEvent của một người dùng
     * @returns UserTrackedEventsResponseDto hoặc null
     */
    static toUserEventsDto(trackedEvents: TrackedEvent[]): UserTrackedEventsResponseDto | null {
        if (!trackedEvents?.length) return null;

        const first = trackedEvents[0];
        const response = new UserTrackedEventsResponseDto();
        response.createdAt = first.createdAt;

        if (first.user) {
            response.user = {
                id: first.user.id,
                firstName: first.user.firstName,
                lastName: first.user.lastName,
                avatar: first.user.avatar
            };
        }

        response.events = trackedEvents
            .filter(te => te.event)
            .map(te => ({
                id: te.id,
                eventId: te.event.id,
                title: te.event.title,
                startTime: te.event.startTime,
                endTime: te.event.endTime,
                position: te.event.position,
                participantNumber: te.event.participantNumber,
                imagesMain: te.event.images?.find(img => img.isMain)?.imageUrl || '',
                createdAt: te.event.createdAt,
                createdBy: te.event.createdBy
            }));

        return response;
    }
}