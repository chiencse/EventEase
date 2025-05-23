import { ApiProperty } from '@nestjs/swagger';

export class EventParticipantResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    title: string;

    @ApiProperty()
    startTime: Date;

    @ApiProperty()
    endTime: Date;

    @ApiProperty()
    position: string;

    @ApiProperty()
    participantNumber: number;

    @ApiProperty()
    imagesMain: string

    @ApiProperty()
    createBy:string;

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