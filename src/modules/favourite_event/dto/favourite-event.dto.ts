import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavouriteEventDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    userId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    eventId: number;
} 