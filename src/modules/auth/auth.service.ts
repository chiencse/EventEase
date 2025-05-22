import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/service/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RevokedToken } from './entities/revoked-token.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name); // Log JWT keys khi khởi tạo service

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        
        @InjectRepository(RevokedToken)
        private readonly revokedTokenRepository: Repository<RevokedToken>,
    ) {}

    onModuleInit() {
        // Xóa token hết hạn khi khởi động service
        this.cleanupExpiredTokens();
    }

    /**
     * Tự động xóa token hết hạn mỗi ngày lúc 00:00
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    private async cleanupExpiredTokens() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await this.revokedTokenRepository.delete({
            revokedAt: LessThan(sevenDaysAgo),
        });
    }

    /**
     * Xử lý đăng nhập
     * @param loginDto Thông tin đăng nhập (username, password)
     * @returns Thông tin user và cặp token (access_token, refresh_token)
     */
    async login(loginDto: LoginDto) {
        // Trim username và password
        loginDto.username = loginDto.username.trim();
        loginDto.password = loginDto.password.trim();

        this.logger.debug(`Login attempt - Username: ${loginDto.username}`);

        // Tìm user theo username
        const user = await this.userService.findByUsername(loginDto.username);
        
        if (!user) {
            throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        this.logger.debug(`Password comparison result: ${isPasswordValid}`);
        
        if (!isPasswordValid) {
            throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
        }

        // Tạo cặp token mới
        this.logger.debug(`Generating tokens for user: ${user.username}`);
        const tokens = await this.getTokens(user.id, user.username, user.firstName, user.lastName, user.avatar);
        this.logger.debug(`Tokens generated successfully`);
        
        return {
            ...tokens
        };
    }

    /**
     * Làm mới token
     * @param refreshToken Refresh token cũ
     * @returns Cặp token mới và thông tin user
     */
    async refreshTokens(refreshToken: string) {
        try {
            // Kiểm tra token đã bị thu hồi chưa
            const isRevoked = await this.isTokenRevoked(refreshToken);
            if (isRevoked) {
                throw new UnauthorizedException('Token đã bị thu hồi');
            }

            // Verify refresh token
            const decoded = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH'),
            });

            // Tìm user để đảm bảo user vẫn tồn tại
            const user = await this.userService.findByUsername(decoded.username);
            if (!user) {
                throw new UnauthorizedException('Token không hợp lệ');
            }

            // Tạo cặp token mới
            const tokens = await this.getTokens(
                user.id,
                user.username,
                user.firstName,
                user.lastName,
                user.avatar
            );

            // Thu hồi refresh token cũ
            await this.revokeToken(refreshToken, 'refresh');

            return {
                ...tokens,
                user: {
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                },
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Token không hợp lệ');
        }
    }

    /**
     * Xử lý đăng xuất
     * @param accessToken Access token cần thu hồi
     * @param refreshToken Refresh token cần thu hồi
     * @returns Thông báo đăng xuất thành công
     */
    async logout(accessToken: string, refreshToken: string) {
        try {
            // Thu hồi cả access token và refresh token
            await this.revokeToken(accessToken, 'access');
            await this.revokeToken(refreshToken, 'refresh');
            return { message: 'Đăng xuất thành công' };
        } catch (error) {
            this.logger.error(`Lỗi khi đăng xuất: ${error.message}`);
            throw new UnauthorizedException('Không thể đăng xuất');
        }
    }

    /**
     * Thu hồi token
     * @param token Token cần thu hồi
     * @param type Loại token (access/refresh)
     * @returns Thông báo thu hồi thành công
     */
    async revokeToken(token: string, type: 'access' | 'refresh') {
        try {
            // Verify token với secret key tương ứng (access/refresh)
            const decoded = this.jwtService.verify(token, {
                secret: type === 'access' 
                    ? this.configService.get<string>('JWT_SECRET')
                    : this.configService.get<string>('JWT_REFRESH'),
            });

            // Tạo bản ghi revoked token với thời gian hết hạn từ token
            const revokedToken = this.revokedTokenRepository.create({
                token,
                type,
                expiresAt: new Date(decoded.exp * 1000), // Chuyển timestamp (s) sang Date
            });

            await this.revokedTokenRepository.save(revokedToken);
            return { message: 'Token đã được thu hồi' };
        } catch (error) {
            if (error instanceof Error) {
                // Nếu token không hợp lệ hoặc đã hết hạn
                // Vẫn lưu vào DB để đảm bảo token không thể sử dụng lại
                // Thời gian hết hạn mặc định là 7 ngày kể từ thời điểm hiện tại
                const revokedToken = this.revokedTokenRepository.create({
                    token,
                    type,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
                });

                await this.revokedTokenRepository.save(revokedToken);
                return { message: 'Token đã được thu hồi' };
            }
            // Nếu có lỗi khác (ví dụ: lỗi DB), throw để xử lý ở tầng trên
            throw error;
        }
    }

    /**
     * Kiểm tra token đã bị thu hồi chưa
     * @param token Token cần kiểm tra
     * @returns true nếu token đã bị thu hồi, false nếu chưa
     */
    async isTokenRevoked(token: string): Promise<boolean> {
        const revokedToken = await this.revokedTokenRepository.findOne({
            where: { token },
        });

        console.log('revokedToken:', revokedToken);
        return !!revokedToken;
    }

    /**
     * Tạo cặp token mới (access token và refresh token)
     * @param userId ID của user
     * @param username Username của user
     * @param firstName Tên của user
     * @param lastName Họ của user
     * @param avatar Avatar của user
     * @returns Cặp token mới
     */
    private async getTokens(
        userId: string,
        username: string,
        firstName: string,
        lastName: string,
        avatar: string,
    ) {
        const [accessToken, refreshToken] = await Promise.all([
            // Tạo access token
            this.jwtService.signAsync(
                {
                    id: userId,
                    username,
                    firstName,
                    lastName,
                    avatar,
                },
                {
                    secret: this.configService.get<string>('JWT_SECRET'),
                    expiresIn: '15m', // Access token hết hạn sau 15 phút
                },
            ),
            // Tạo refresh token
            this.jwtService.signAsync(
                {
                    id: userId,
                    username,
                    firstName,
                    lastName,
                    avatar,
                },
                {
                    secret: this.configService.get<string>('JWT_REFRESH'),
                    expiresIn: '7d', // Refresh token hết hạn sau 7 ngày
                },
            ),
        ]);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
} 