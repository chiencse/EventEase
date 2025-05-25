import { ApiProperty } from '@nestjs/swagger';

export class EventTrackedResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
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

    @ApiProperty({ type: [Object] })
    users: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string;
    }[];

    @ApiProperty()
    createdAt: Date;
}

export class UserTrackedEventsResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string;
    };

    @ApiProperty({ type: [Object] })
    events: {
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        position: string;
        participantNumber: number;
        imagesMain: string;
        createdAt: Date;
        createdBy: string;
    }[];

    @ApiProperty()
    createdAt: Date;
}
