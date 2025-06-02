import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'Nguyễn', description: 'Tên của người dùng' })
    @IsNotEmpty({ message: 'Tên không được để trống' })
    @IsString({ message: 'Tên phải là chuỗi' })
    firstName: string;

    @ApiProperty({ example: 'Văn A', description: 'Họ của người dùng' })
    @IsNotEmpty({ message: 'Họ không được để trống' })
    @IsString({ message: 'Họ phải là chuỗi' })
    lastName: string;

    @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email của người dùng' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({ example: 'nguyenvana', description: 'Tên đăng nhập' })
    @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
    @IsString({ message: 'Tên đăng nhập phải là chuỗi' })
    @MinLength(4, { message: 'Tên đăng nhập phải có ít nhất 4 ký tự' })
    username: string;

    @ApiProperty({ example: 'Password123!', description: 'Mật khẩu' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @IsString({ message: 'Mật khẩu phải là chuỗi' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
        }
    )
    password: string;

    @ApiProperty({ example: 'Password123!', description: 'Xác nhận mật khẩu' })
    @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
    @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi' })
    confirmPassword: string;
} 