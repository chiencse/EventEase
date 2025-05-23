import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ITrackedEvent } from '../interfaces/tracked-event.interface';

export class CreateTrackedEventDto implements ITrackedEvent {
    @ApiProperty({ example: 1 })
    @IsString()
    eventId: string;
} 