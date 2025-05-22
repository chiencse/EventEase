import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/service/user.service';
import { Request } from 'express';

/**
 * Chiến lược xác thực JWT cho refresh token
 * - Được sử dụng cho các route làm mới access token
 * - Kiểm tra token hợp lệ, user còn tồn tại
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    /**
     * Khởi tạo chiến lược JWT refresh
     * @param configService Lấy biến môi trường JWT_REFRESH
     * @param userService Dùng để tìm user từ payload
     */
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {
        const secret = configService.get<string>('JWT_REFRESH');
        if (!secret) {
            throw new Error('JWT_REFRESH is not defined');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy token từ header Authorization
            secretOrKey: secret, // Khóa bí mật để verify refresh token
            passReqToCallback: true, // Cho phép truyền req vào validate
        } as any);
    }

    /**
     * Hàm validate được gọi sau khi token đã được giải mã và xác thực chữ ký
     * @param req Request gốc để lấy raw refresh token
     * @param payload Payload của JWT (chứa thông tin user)
     * @returns Thông tin user và refresh token nếu hợp lệ, throw lỗi nếu không hợp lệ
     */
    async validate(req: Request, payload: any) {
        // Lấy refresh token từ header Authorization
        const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
        if (!refreshToken) {
            throw new UnauthorizedException('Token không hợp lệ');
        }

        // Tìm user từ payload
        const user = await this.userService.findByUsername(payload.username);
        if (!user) {
            throw new UnauthorizedException('Token không hợp lệ');
        }

        // Trả về payload và refresh token cho request
        return {
            ...payload,
            refreshToken,
        };
    }
} 