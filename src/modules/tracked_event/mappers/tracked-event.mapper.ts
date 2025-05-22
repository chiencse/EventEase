import { TrackedEvent } from '../entities/tracked-event.entity';
import { TrackedEventResponseDto } from '../dto/tracked-event-response.dto';
import { EventMapper } from 'src/modules/event/mappers/event.mapper';

export class TrackedEventMapper {

    /**
     * Chuyển đổi đối tượng TrackedEvent thành đối tượng TrackedEventResponseDto
     * Chỉ lấy ảnh chính của sự kiện
     * @param trackedEvent - Đối tượng TrackedEvent cần chuyển đổi
     * @returns Đối tượng TrackedEventResponseDto hoặc null nếu đối tượng null
     */
    static toResponseDto(trackedEvent: TrackedEvent): TrackedEventResponseDto | null {
        if(!trackedEvent) return null;

        const response = new TrackedEventResponseDto();
        response.id = trackedEvent.id;
        response.eventId = trackedEvent.eventId;
        response.userId = trackedEvent.userId;

        if (trackedEvent.event) {
            const eventDto = EventMapper.toResponseDto(trackedEvent.event);
            eventDto?.images && (eventDto.images = eventDto.images.filter(img => img.isMain));
            response.event = eventDto;
        }

        return response;
    }
}