import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ICreateUser } from '../../interfaces/user.interface';

export class CreateUserDto implements ICreateUser {
    @ApiProperty({ example: 'Nguyễn' })
    @IsString({ message: 'Họ phải là chuỗi ký tự' })
    @MaxLength(50, { message: 'Họ không được vượt quá 50 ký tự' })
    firstName: string;

    @ApiProperty({ example: 'Văn A' })
    @IsString({ message: 'Tên phải là chuỗi ký tự' })
    @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
    lastName: string;

    @ApiProperty({ 
        example: '01-01-1990', 
        required: false,
        description: 'Định dạng: DD-MM-YYYY hoặc DD/MM/YYYY (ví dụ: 01-01-1990 hoặc 01/01/1990)'
    })
    @IsOptional()
    @Matches(/^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[0-2])[-/]\d{4}$/, {
        message: 'Ngày sinh phải có định dạng DD-MM-YYYY hoặc DD/MM/YYYY (ví dụ: 01-01-1990)'
    })
    dateOfBirth?: string;

    @ApiProperty({ example: 'nguyenvana@gmail.com' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({ example: 'Quận 1, TP.HCM', required: false })
    @IsOptional()
    @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
    location?: string;

    @ApiProperty({ example: '0987654321', required: false })
    @IsOptional()
    @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
    @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, {
        message: 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08, 09 và có 10 chữ số'
    })
    phoneNumber?: string;

    @ApiProperty({ example: 'nguyenvana' })
    @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
    @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
    @MaxLength(30, { message: 'Tên đăng nhập không được vượt quá 30 ký tự' })
    @Matches(/^[a-zA-Z0-9_-]+$/, {
        message: 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch ngang và dấu gạch dưới'
    })
    username: string;

    @ApiProperty({ example: 'MatKhau123!' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @MaxLength(32, { message: 'Mật khẩu không được vượt quá 32 ký tự' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số hoặc ký tự đặc biệt'
    })
    password: string;
} 