import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from 'src/modules/event/dto/response/event-response.dto';

export class FavouriteEventResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    eventId: string;

    @ApiProperty({ type: EventResponseDto, required: false })
    event: EventResponseDto | null;
} 