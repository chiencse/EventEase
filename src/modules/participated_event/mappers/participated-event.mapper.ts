import { ParticipatedEvent } from '../entities/participated-event.entity';
import { ParticipatedEventResponseDto } from '../dto/participated-event-response.dto';
import { EventMapper } from 'src/modules/event/mappers/event.mapper';

export class ParticipatedEventMapper {
    /**
     * Chuyển đổi đối tượng ParticipatedEvent thành đối tượng ParticipatedEventResponseDto
     * Chỉ lấy ảnh chính của sự kiện
     * @param participatedEvent - Đối tượng ParticipatedEvent cần chuyển đổi
     * @returns Đối tượng ParticipatedEventResponseDto hoặc null nếu đối tượng null
     */
    static toResponseDto(participatedEvent: ParticipatedEvent): ParticipatedEventResponseDto | null {
        if(!participatedEvent) return null;

        const response = new ParticipatedEventResponseDto();
        response.id = participatedEvent.id;
        response.eventId = participatedEvent.eventId;
        response.userId = participatedEvent.userId;

        if (participatedEvent.event) {
            const eventDto = EventMapper.toResponseDto(participatedEvent.event);
            eventDto?.images && (eventDto.images = eventDto.images.filter(img => img.isMain));
            response.event = eventDto;
        }

        return response;
    }
} 