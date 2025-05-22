import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'nguyenvana' })
    @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
    username: string;

    @ApiProperty({ example: 'MatKhau123!' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    password: string;
} 