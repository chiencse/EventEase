import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavouriteEventDto {
    @ApiProperty({ example: 'uuid' })
    @IsString()
    eventId: string;
} 