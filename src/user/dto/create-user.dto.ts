import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'email@gmail.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The status of the user',
    example: true,
  })
  @IsBoolean()
  isActive?: boolean;
}
