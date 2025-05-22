import { Event } from '../entities/event.entity';
import { EventResponseDto } from '../dto/response/event-response.dto';
import { ImageInfoDto } from '../dto/response/image-info-response.dto';
import { HashtagResponseDto } from '../dto/response/hashtag-response.dto';

export class EventMapper {

    /**
     * Chuyển đổi đối tượng Event thành đối tượng EventResponseDto
     * @param event - Đối tượng Event cần chuyển đổi
     * @returns Đối tượng EventResponseDto hoặc null nếu đối tượng null
     */
    static toResponseDto(event: Event): EventResponseDto | null {
        if (!event) return null;

        const response = new EventResponseDto();
        response.id = event.id.toString();
        response.title = event.title;
        response.description = event.description;
        response.startTime = event.startTime;
        response.endTime = event.endTime;
        response.participantNumber = event.participantNumber;
        response.position = event.position;

        if (event.images && event.images.length > 0) {
            response.images = event.images.map(image => {
                const imageDto = new ImageInfoDto();
                imageDto.id = image.id.toString();
                imageDto.link = image.imageUrl;
                imageDto.size = parseInt(image.fileSize);
                imageDto.filename = image.fileName;
                return imageDto;
            });
        }

        if (event.eventHashtags && event.eventHashtags.length > 0) {
            response.hashtags = event.eventHashtags.map(eh => {
                const hashtagDto = new HashtagResponseDto();
                hashtagDto.id = eh.hashtag.id;
                hashtagDto.name = eh.hashtag.name;
                hashtagDto.usageCount = eh.hashtag.usageCount;
                return hashtagDto;
            });
        }

        return response;
    }
} 