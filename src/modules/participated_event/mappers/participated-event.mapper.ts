import { ParticipatedEvent } from '../entities/participated-event.entity';
import { EventParticipantResponseDto } from '../dto/event-participant-response.dto';

export class ParticipatedEventMapper {
    /**
     * Chuyển đổi 1 đối tượng ParticipatedEvent (1 người tham gia trong 1 sự kiện)
     * thành định dạng DTO trả về cho client.
     *
     * Lưu ý: Mỗi DTO trả về chỉ chứa duy nhất 1 người dùng.
     *
     * @param participatedEvent - Đối tượng `ParticipatedEvent` (1 bản ghi người tham gia sự kiện)
     * @returns Đối tượng `EventParticipantResponseDto` hoặc null nếu đầu vào null
     */
    static toResponseDto(participatedEvent: ParticipatedEvent): EventParticipantResponseDto | null {
        if (!participatedEvent) return null;

        const response = new EventParticipantResponseDto();
        response.id = participatedEvent.id.toString();

        if (participatedEvent.event) {
            response.event = {
                id: participatedEvent.event.id,
                title: participatedEvent.event.title,
                startTime: participatedEvent.event.startTime,
                endTime: participatedEvent.event.endTime,
                position: participatedEvent.event.position,
                participantNumber: participatedEvent.event.participantNumber,
                imagesMain: participatedEvent.event.images?.find(img => img.isMain)?.imageUrl || '',
                createBy: participatedEvent.event.createdBy
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

        response.createdAt = participatedEvent.createdAt;

        return response;
    }

    /**
     * Gộp danh sách ParticipatedEvent (nhiều người tham gia cùng 1 sự kiện)
     * thành 1 đối tượng DTO duy nhất chứa thông tin sự kiện và danh sách người dùng.
     *
     * Dùng khi bạn muốn:
     * - Trả về 1 sự kiện duy nhất
     * - Kèm theo danh sách tất cả người tham gia sự kiện đó
     *
     * Ví dụ trả về:
     * {
     *   id: "1",
     *   event: { ... },
     *   users: [user1, user2, ...],
     *   createdAt: ...
     * }
     *
     * @param participatedEvents - Danh sách `ParticipatedEvent` (người dùng tham gia cùng 1 event)
     * @returns DTO `EventParticipantResponseDto` hoặc null nếu danh sách trống
     */

    static toListResponseDto(participatedEvents: ParticipatedEvent[]): EventParticipantResponseDto | null {
        if (!participatedEvents || participatedEvents.length === 0) return null;

        const first = participatedEvents[0];
        const response = new EventParticipantResponseDto();

        response.id = first.id.toString();
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
            createBy: first.event.createdBy
        };
        }

        response.users = participatedEvents
        .map(pe => pe.user)
        .filter(user => user != null)
        .map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
        }));

        return response;
    }
}