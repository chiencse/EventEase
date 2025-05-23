import { ApiProperty } from '@nestjs/swagger';

export class UserParticipatedEventsResponseDto {
    @ApiProperty()
    userId: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    avatar: string;

    @ApiProperty({
        type: [Object],
    })
    events: {
        id: number;
        title: string;
        startTime: Date;
        endTime: Date;
        position: string;
        participantNumber: number;
        imagesMain: string;
        createBy: string;
  }[];

    @ApiProperty()
    createdAt: Date;
}
