import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()

/**
 * Guard xác thực JWT token.
 * 
 * Hoạt động:
 * - Kiểm tra token trong header Authorization
 * - Xác thực token bằng JWT service
 * - Lưu thông tin user vào request nếu hợp lệ
 * - Throw UnauthorizedException nếu không có token hoặc token không hợp lệ
 * 
 * Sử dụng:
 * - Đặt @UseGuards(AuthGuard) trên controller hoặc route cần xác thực
 * - Token phải ở dạng: Bearer <token>
 */

export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  /**
   * Kiểm tra xác thực token trong request
   * @param context - ExecutionContext chứa thông tin request
   * @returns true nếu token hợp lệ, throw UnauthorizedException nếu không hợp lệ
   * 
   * Quy trình:
   * 1. Lấy token từ header Authorization
   * 2. Kiểm tra token có tồn tại không
   * 3. Xác thực token bằng JWT service
   * 4. Lưu thông tin user vào request nếu hợp lệ
   * 5. Throw UnauthorizedException nếu có lỗi
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // console.log('Request:', request);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      console.log('No token found');
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      })) as any;
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  /**
   * Trích xuất token từ header Authorization
   * @param request - Request chứa header Authorization
   * @returns Token nếu tồn tại và đúng định dạng Bearer, undefined nếu không
   * 
   * Quy trình:
   * 1. Lấy giá trị header Authorization
   * 2. Kiểm tra header có tồn tại không
   * 3. Tách header thành type và token
   * 4. Trả về token nếu type là Bearer
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const str = request.headers['authorization'];
    if (!str) {
      throw new UnauthorizedException();
    }
    const [type, token] = str.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
