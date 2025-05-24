import { ParticipatedEvent } from '../entities/participated-event.entity';
import { EventParticipantResponseDto, UserParticipatedEventsResponseDto } from '../dto/event-participant-response.dto';

export class ParticipatedEventMapper {
    /**
     * Chuyển đổi 1 đối tượng ParticipatedEvent thành định dạng DTO trả về cho client
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy thông tin chi tiết của 1 bản ghi tham gia sự kiện
     * - Ví dụ: Khi người dùng đăng ký tham gia sự kiện, trả về thông tin xác nhận
     * - Hoặc khi cần kiểm tra trạng thái tham gia của 1 người trong 1 sự kiện
     * 
     * @param participatedEvent - Đối tượng ParticipatedEvent
     * @returns EventParticipantResponseDto hoặc null
     */
    static toResponseDto(participatedEvent: ParticipatedEvent): EventParticipantResponseDto | null {
        if (!participatedEvent) return null;

        const response = new EventParticipantResponseDto();
        response.id = participatedEvent.id;
        response.createdAt = participatedEvent.createdAt;

        if (participatedEvent.event) {
            response.event = {
                id: participatedEvent.event.id,
                title: participatedEvent.event.title,
                startTime: participatedEvent.event.startTime,
                endTime: participatedEvent.event.endTime,
                position: participatedEvent.event.position,
                participantNumber: participatedEvent.event.participantNumber,
                imagesMain: participatedEvent.event.images?.find(img => img.isMain)?.imageUrl || '',
                createdBy: participatedEvent.event.createdBy
            };
        }

        if (participatedEvent.user) {
            response.users = [{
                id: participatedEvent.user.id,
                firstName: participatedEvent.user.firstName,
                lastName: participatedEvent.user.lastName,
                avatar: participatedEvent.user.avatar
            }];
        }

        return response;
    }

    /**
     * Gộp danh sách ParticipatedEvent của một sự kiện thành một DTO
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy danh sách tất cả người tham gia của 1 sự kiện
     * - Ví dụ: Hiển thị danh sách người tham gia trong trang chi tiết sự kiện
     * - Hoặc khi cần thống kê số lượng người tham gia sự kiện
     * 
     * Cấu trúc dữ liệu trả về:
     * {
     *   id: string,
     *   event: { thông tin sự kiện },
     *   users: [ danh sách người tham gia ],
     *   createdAt: Date
     * }
     * 
     * @param participatedEvents - Danh sách ParticipatedEvent của một sự kiện
     * @returns EventParticipantResponseDto hoặc null
     */
    static toEventParticipantsDto(participatedEvents: ParticipatedEvent[]): EventParticipantResponseDto | null {
        if (!participatedEvents?.length) return null;

        const first = participatedEvents[0];
        const response = new EventParticipantResponseDto();
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

        response.users = participatedEvents
            .map(pe => pe.user)
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
     * Gộp danh sách ParticipatedEvent của một người dùng thành một DTO
     * 
     * Mục đích sử dụng:
     * - Dùng khi cần lấy danh sách tất cả sự kiện mà 1 người dùng đã tham gia
     * - Ví dụ: Hiển thị danh sách sự kiện đã tham gia trong trang profile người dùng
     * - Hoặc khi cần thống kê lịch sử tham gia sự kiện của người dùng
     * 
     * Cấu trúc dữ liệu trả về:
     * {
     *   id: string,
     *   user: { thông tin người dùng },
     *   events: [ danh sách sự kiện đã tham gia ],
     *   createdAt: Date
     * }
     * 
     * @param participatedEvents - Danh sách ParticipatedEvent của một người dùng
     * @returns UserParticipatedEventsResponseDto hoặc null
     */
    static toUserEventsDto(participatedEvents: ParticipatedEvent[]): UserParticipatedEventsResponseDto | null {
        if (!participatedEvents?.length) return null;

        const first = participatedEvents[0];
        const response = new UserParticipatedEventsResponseDto();
        response.createdAt = first.createdAt;

        if (first.user) {
            response.user = {
                id: first.user.id,
                firstName: first.user.firstName,
                lastName: first.user.lastName,
                avatar: first.user.avatar
            };
        }

        response.events = participatedEvents
        .filter(pe => pe.event)
        .map(pe => ({
            id: pe.id,                
            eventId: pe.event.id,        
            title: pe.event.title,
            startTime: pe.event.startTime,
            endTime: pe.event.endTime,
            position: pe.event.position,
            participantNumber: pe.event.participantNumber,
            imagesMain: pe.event.images?.find(img => img.isMain)?.imageUrl || '',
            createdAt: pe.event.createdAt,
            createdBy: pe.event.createdBy
        }));

        return response;
    }
}