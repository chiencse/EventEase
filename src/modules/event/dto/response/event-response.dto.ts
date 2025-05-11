import { ApiProperty } from '@nestjs/swagger';
import { ImageInfoDto } from './image-info-response.dto'; 

export class EventResponseDto {
    @ApiProperty({ example: 'event001' })
    id: string;
  
    @ApiProperty({ example: 'Hội thảo AI' })
    title: string;
  
    @ApiProperty({ example: 'Sự kiện chuyên sâu về trí tuệ nhân tạo' })
    description: string;
  
    @ApiProperty({ example: '2025-06-01T09:00:00.000Z' })
    startTime: Date;
  
    @ApiProperty({ example: '2025-06-01T12:00:00.000Z' })
    endTime: Date;
  
    @ApiProperty({ example: 'tech' })
    tag: string;
  
    @ApiProperty({ example: 150 })
    participantNumber: number;
  
    @ApiProperty({ example: 'Phòng A1.01, ĐH Bách Khoa' })
    position: string;
  
    @ApiProperty({ type: [ImageInfoDto], required: false })
    images?: ImageInfoDto[];
  }
  