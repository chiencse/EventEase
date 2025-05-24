import { ApiProperty } from '@nestjs/swagger';

export class EventFavouriteResponseDto {
    @ApiProperty({
        description: 'ID của bản ghi yêu thích',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    id: string;

    @ApiProperty({
        description: 'Thông tin sự kiện được yêu thích',
        type: 'object',
        properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            title: { type: 'string', example: 'Sự kiện mẫu' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            position: { type: 'string', example: 'Hà Nội' },
            participantNumber: { type: 'number', example: 100 },
            imagesMain: { type: 'string', example: 'https://example.com/image.jpg' },
            createdBy: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
        }
    })
    event: {
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        position: string;
        participantNumber: number;
        imagesMain: string;
        createdBy: string;
    };

    @ApiProperty({
        description: 'Danh sách người dùng yêu thích sự kiện',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                firstName: { type: 'string', example: 'Nguyễn' },
                lastName: { type: 'string', example: 'Văn A' },
                avatar: { type: 'string', example: 'https://example.com/avatar.jpg' }
            }
        }
    })
    users: Array<{
        id: string;
        firstName: string;
        lastName: string;
        avatar: string;
    }>;

    @ApiProperty({
        description: 'Thời gian tạo bản ghi yêu thích',
        type: 'string',
        format: 'date-time'
    })
    createdAt: Date;
}

export class UserFavouriteEventsResponseDto {
    @ApiProperty({
        description: 'Thông tin người dùng',
        type: 'object',
        properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            firstName: { type: 'string', example: 'Nguyễn' },
            lastName: { type: 'string', example: 'Văn A' },
            avatar: { type: 'string', example: 'https://example.com/avatar.jpg' }
        }
    })
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string;
    };

    @ApiProperty({
        description: 'Danh sách sự kiện yêu thích',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                eventId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                title: { type: 'string', example: 'Sự kiện mẫu' },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                position: { type: 'string', example: 'Hà Nội' },
                participantNumber: { type: 'number', example: 100 },
                imagesMain: { type: 'string', example: 'https://example.com/image.jpg' },
                createdAt: { type: 'string', format: 'date-time' },
                createdBy: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
            }
        }
    })
    events: Array<{
        id: string;
        eventId: string;
        title: string;
        startTime: Date;
        endTime: Date;
        position: string;
        participantNumber: number;
        imagesMain: string;
        createdAt: Date;
        createdBy: string;
    }>;

    @ApiProperty({
        description: 'Thời gian tạo bản ghi yêu thích đầu tiên',
        type: 'string',
        format: 'date-time'
    })
    createdAt: Date;
} 