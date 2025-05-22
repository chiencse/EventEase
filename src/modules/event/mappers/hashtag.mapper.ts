import { Hashtag } from '../entities/hashtag.entity';
import { HashtagResponseDto } from '../dto/response/hashtag-response.dto';

export class HashtagMapper {
    static toResponseDto(hashtag: Hashtag): HashtagResponseDto {
        const dto = new HashtagResponseDto();
        dto.id = hashtag.id;
        dto.name = hashtag.name;
        dto.usageCount = hashtag.usageCount;
        dto.isActive = hashtag.isActive;
        return dto;
    }

    static toResponseDtoList(hashtags: Hashtag[]): HashtagResponseDto[] {
        return hashtags.map(hashtag => this.toResponseDto(hashtag));
    }
} 