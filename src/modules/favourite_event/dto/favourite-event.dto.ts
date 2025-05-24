import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavouriteEventDto {
    @ApiProperty({
        description: 'ID của sự kiện cần thêm vào danh sách yêu thích',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsNotEmpty()
    @IsString()
    eventId: string;
} 