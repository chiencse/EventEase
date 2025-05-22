import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
    @Expose()
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @Expose()
    @ApiProperty({ example: 'Nguyễn' })
    firstName: string;

    @Expose()
    @ApiProperty({ example: 'Văn A' })
    lastName: string;

    @Expose()
    @ApiProperty({ example: '1990-01-01', required: false })
    dateOfBirth?: Date;

    @Expose()
    @ApiProperty({ example: 'nguyenvana@gmail.com' })
    email: string;

    @Expose()
    @ApiProperty({ example: 'Quận 1, TP.HCM', required: false })
    location?: string;

    @Expose()
    @ApiProperty({ example: '0987654321', required: false })
    phoneNumber?: string;

    @Expose()
    @ApiProperty({ example: 'nguyenvana' })
    username: string;

    @Expose()
    @ApiProperty({ example: 'Nguyễn Văn A' })
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
} 