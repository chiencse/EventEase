import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFollowerDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID của người được theo dõi' })
    @IsString()
    userId: string;
} 