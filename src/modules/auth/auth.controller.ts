import { Controller, Post, Body, UnauthorizedException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Đăng nhập
     * @param loginDto Dữ liệu đăng nhập
     * @returns Token và refresh token
     */
    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập' })
    @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
    @ApiResponse({ status: 401, description: 'Tên đăng nhập hoặc mật khẩu không đúng' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    /**
     * Làm mới token
     * @param refreshTokenDto Dữ liệu làm mới token
     * @returns Token và refresh token
     */
    @Post('refresh')
    @ApiOperation({ summary: 'Làm mới token' })
    @ApiResponse({ status: 200, description: 'Làm mới token thành công' })
    @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        if (!refreshTokenDto.refreshToken) {
            throw new UnauthorizedException('Refresh token không được cung cấp');
        }
        return this.authService.refreshTokens(refreshTokenDto.refreshToken);
    }

    /**
     * Đăng xuất
     * @param logoutDto Dữ liệu đăng xuất
     * @returns Thông báo đăng xuất thành công
     */
    @Post('logout')
    @ApiOperation({ summary: 'Đăng xuất' })
    @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
    async logout(@Body() logoutDto: LogoutDto) {
        if (!logoutDto.accessToken || !logoutDto.refreshToken) {
            throw new UnauthorizedException('Access token hoặc refresh token không được cung cấp');
        }
        return this.authService.logout(logoutDto.accessToken, logoutDto.refreshToken);
    }

    /**
     * Quên mật khẩu
     * @param forgotPasswordDto Dữ liệu quên mật khẩu
     * @returns Thông báo đã gửi mã OTP qua email
     */
    @Post('forgot-password')
    @ApiOperation({ summary: 'Quên mật khẩu' })
    @ApiResponse({ status: 200, description: 'Đã gửi mã OTP qua email' })
    @ApiResponse({ status: 404, description: 'Email không tồn tại trong hệ thống' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    /**
     * Xác thực OTP
     * @param verifyOtpDto Dữ liệu xác thực OTP
     * @returns Thông báo xác thực OTP thành công
     */
    @Post('verify-otp')
    @ApiOperation({ summary: 'Xác thực OTP' })
    @ApiResponse({ status: 200, description: 'Xác thực OTP thành công' })
    @ApiResponse({ status: 401, description: 'Mã OTP không hợp lệ hoặc đã hết hạn' })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyOtp(verifyOtpDto);
    }

    /**
     * Đổi mật khẩu sau khi xác thực OTP
     * @param email Email của người dùng
     * @param resetPasswordDto Dữ liệu đổi mật khẩu
     * @returns Thông báo đổi mật khẩu thành công
     */
    @Post('reset-password/:email')
    @ApiOperation({ summary: 'Đổi mật khẩu sau khi xác thực OTP' })
    @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
    @ApiResponse({ status: 400, description: 'Mật khẩu mới và xác nhận mật khẩu không khớp' })
    @ApiResponse({ status: 401, description: 'Vui lòng xác thực OTP trước khi đổi mật khẩu' })
    @ApiResponse({ status: 404, description: 'Email không tồn tại trong hệ thống' })
    async resetPassword(
        @Param('email') email: string,
        @Body() resetPasswordDto: ResetPasswordDto
    ) {
        return this.authService.resetPassword(email, resetPasswordDto);
    }
} 
