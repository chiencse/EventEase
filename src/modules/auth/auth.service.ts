import { Injectable, UnauthorizedException, OnModuleInit, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/service/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RevokedToken } from './entities/revoked-token.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OTP } from './entities/otp.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { MailService } from '../../common/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name); // Log JWT keys khi khởi tạo service

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        
        @InjectRepository(RevokedToken)
        private readonly revokedTokenRepository: Repository<RevokedToken>,

        @InjectRepository(OTP)
        private readonly otpRepository: Repository<OTP>,
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

        // Log để debug
        this.logger.debug('Stored hashed password:', user.password);
        this.logger.debug('Input password:', loginDto.password);

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

            return { ...tokens };
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

    /**
     * Xử lý quên mật khẩu
     * @param forgotPasswordDto Thông tin email
     * @returns Thông báo đã gửi OTP
     */
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const user = await this.userService.findByEmail(forgotPasswordDto.email);
        if (!user) {
            throw new NotFoundException('Email không tồn tại trong hệ thống');
        }

        // Tạo mã OTP 6 số
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Tính thời gian hết hạn (5 phút)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        // Lưu OTP vào database
        const otp = this.otpRepository.create({
            email: forgotPasswordDto.email,
            code: otpCode,
            isUsed: false,
            expiresAt,
        });
        await this.otpRepository.save(otp);

        // Gửi email chứa OTP
        const emailContent = `
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Mã OTP của bạn là: <strong>${otpCode}</strong></p>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        `;

        await this.mailService.send(
            forgotPasswordDto.email,
            'Mã xác thực đặt lại mật khẩu',
            emailContent
        );

        return { message: 'Đã gửi mã OTP qua email' };
    }

    /**
     * Xác thực OTP
     * @param verifyOtpDto Thông tin email và mã OTP
     * @returns true nếu OTP hợp lệ
     */
    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const otp = await this.otpRepository.findOne({
            where: {
                email: verifyOtpDto.email,
                code: verifyOtpDto.code,
                isUsed: false,
            },
            order: { createdAt: 'DESC' },
        });

        if (!otp) {
            throw new UnauthorizedException('Mã OTP không hợp lệ');
        }

        if (otp.expiresAt < new Date()) {
            throw new UnauthorizedException('Mã OTP đã hết hạn');
        }

        // Đánh dấu OTP đã sử dụng
        otp.isUsed = true;
        await this.otpRepository.save(otp);

        return true;
    }

    /**
     * Xóa OTP hết hạn mỗi ngày
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    private async cleanupExpiredOtps() {
        await this.otpRepository.delete({
            expiresAt: LessThan(new Date()),
        });
    }

    /**
     * Đổi mật khẩu sau khi xác thực OTP thành công
     * @param email Email của người dùng
     * @param resetPasswordDto Thông tin mật khẩu mới
     * @returns Thông báo đổi mật khẩu thành công
     */
    async resetPassword(email: string, resetPasswordDto: ResetPasswordDto) {
        // Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp nhau không
        if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
            throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
        }

        // Tìm user theo email
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('Email không tồn tại trong hệ thống');
        }

        // Kiểm tra OTP đã được xác thực chưa
        const verifiedOtp = await this.otpRepository.findOne({
            where: {
                email,
                isUsed: true,
            },
            order: { createdAt: 'DESC' },
        });

        if (!verifiedOtp) {
            throw new UnauthorizedException('Vui lòng xác thực OTP trước khi đổi mật khẩu');
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await this.userService['hashPassword'](resetPasswordDto.newPassword);
        this.logger.debug('New hashed password:', hashedPassword);

        // Cập nhật mật khẩu mới
        await this.userService['userRepository'].update(user.id, { password: hashedPassword });
        this.logger.debug('Password updated successfully');

        // Xóa tất cả OTP của email này
        await this.otpRepository.delete({ email });

        return { message: 'Đổi mật khẩu thành công' };
    }
} 