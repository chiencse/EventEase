import { Controller, Post, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập' })
    @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
    @ApiResponse({ status: 401, description: 'Tên đăng nhập hoặc mật khẩu không đúng' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

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

    @Post('logout')
    @ApiOperation({ summary: 'Đăng xuất' })
    @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
    async logout(@Body() logoutDto: LogoutDto) {
        if (!logoutDto.accessToken || !logoutDto.refreshToken) {
            throw new UnauthorizedException('Access token hoặc refresh token không được cung cấp');
        }
        return this.authService.logout(logoutDto.accessToken, logoutDto.refreshToken);
    }
} 
