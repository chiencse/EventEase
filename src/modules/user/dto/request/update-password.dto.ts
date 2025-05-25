import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { IUpdatePassword } from '../../interfaces/user.interface';

export class UpdatePasswordDto implements IUpdatePassword {
    @ApiProperty({ example: 'MatKhau123!' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @IsOptional()
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @MaxLength(32, { message: 'Mật khẩu không được vượt quá 32 ký tự' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số hoặc ký tự đặc biệt'
    })
    oldPassword: string;

    @ApiProperty({ example: 'MatKhau123!' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @MaxLength(32, { message: 'Mật khẩu không được vượt quá 32 ký tự' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số hoặc ký tự đặc biệt'
    })
    newPassword: string;

    @ApiProperty({ example: 'MatKhau123!' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @MaxLength(32, { message: 'Mật khẩu không được vượt quá 32 ký tự' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số hoặc ký tự đặc biệt'
    })
    confirmPassword: string;
} 