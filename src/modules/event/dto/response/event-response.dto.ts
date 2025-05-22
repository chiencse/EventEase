import { ApiProperty } from '@nestjs/swagger';
import { ImageInfoDto } from './image-info-response.dto';
import { HashtagResponseDto } from './hashtag-response.dto';

export class EventResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;
  
    @ApiProperty({ example: 'Hội thảo AI' })
    title: string;
  
    @ApiProperty({ example: 'Sự kiện dành cho sinh viên ngành AI' })
    description: string;
  
    @ApiProperty({ example: '2025-06-01T09:00:00.000Z' })
    startTime: Date;
  
    @ApiProperty({ example: '2025-06-01T12:00:00.000Z' })
    endTime: Date;
  
    @ApiProperty({ example: 100 })
    participantNumber: number;
  
    @ApiProperty({ example: 'Phòng A1.01, ĐH Bách Khoa' })
    position: string;

    @ApiProperty({ type: [ImageInfoDto], required: false })
    images?: ImageInfoDto[];
  
    @ApiProperty({ type: [HashtagResponseDto] })
    hashtags: HashtagResponseDto[];
  
    @ApiProperty({ example: '2024-03-15T08:00:00Z' })
    createdAt: Date;
  
    @ApiProperty({ example: '2024-03-15T08:00:00Z' })
    updatedAt: Date;
  }
  