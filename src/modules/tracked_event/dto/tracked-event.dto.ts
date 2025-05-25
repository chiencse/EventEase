import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ITrackedEvent } from '../interfaces/tracked-event.interface';

export class CreateTrackedEventDto implements ITrackedEvent {
    @ApiProperty({
        description: 'ID của sự kiện cần theo dõi',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsNotEmpty()
    @IsString()
    eventId: string;
} 