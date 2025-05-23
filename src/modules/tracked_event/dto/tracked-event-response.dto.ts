import { ApiProperty } from '@nestjs/swagger';
import { ITrackedEventResponse } from '../interfaces/tracked-event.interface';
import { EventResponseDto } from 'src/modules/event/dto/response/event-response.dto';

export class TrackedEventResponseDto implements ITrackedEventResponse {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1 })
    eventId: string;

    @ApiProperty({ example: 1 })
    userId: string;

    @ApiProperty({ type: EventResponseDto, required: false })
    event: EventResponseDto | null;
    
}
