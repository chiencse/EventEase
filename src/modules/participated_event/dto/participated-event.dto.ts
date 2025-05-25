import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParticipatedEventDto {
    @ApiProperty({ example: 1 })
    @IsString()
    eventId: string;
} 