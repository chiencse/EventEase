import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from 'src/modules/event/dto/response/event-response.dto';


export class ParticipatedEventResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: number;

    @ApiProperty()
    eventId: number;

    @ApiProperty({ type: EventResponseDto, required: false })
    event: EventResponseDto | null;
} 