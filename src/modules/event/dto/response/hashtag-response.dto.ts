import { ApiProperty } from '@nestjs/swagger';

export class HashtagResponseDto {
    @ApiProperty({ example: '6362747b-2dcb-4522-9989-18f58577e592' })
    id: string;

    @ApiProperty({ example: '#tech' })
    name: string;

    @ApiProperty({ example: 1 })
    usageCount: number;

    @ApiProperty({ example: true })
    isActive: boolean;
} 