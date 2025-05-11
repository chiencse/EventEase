import { FavouriteEvent } from '../entities/favourite-event.entity';
import { FavouriteEventResponseDto } from '../dto/favourite-event-response.dto';
import { EventMapper } from 'src/modules/event/mappers/event.mapper';

export class FavouriteEventMapper {
    /**
     * Chuyển đổi đối tượng FavouriteEvent thành đối tượng FavouriteEventResponseDto
     * Chỉ lấy ảnh chính của sự kiện
     * @param favouriteEvent - Đối tượng FavouriteEvent cần chuyển đổi
     * @returns Đối tượng FavouriteEventResponseDto hoặc null nếu đối tượng null
     */
    static toResponseDto(favouriteEvent: FavouriteEvent): FavouriteEventResponseDto | null {
        if(!favouriteEvent) return null;

        const response = new FavouriteEventResponseDto();
        response.id = favouriteEvent.id;
        response.eventId = favouriteEvent.eventId;
        response.userId = favouriteEvent.userId;

        if (favouriteEvent.event) {
            const eventDto = EventMapper.toResponseDto(favouriteEvent.event);
            eventDto?.images && (eventDto.images = eventDto.images.filter(img => img.isMain));
            response.event = eventDto;
        }

        return response;
    }
} 