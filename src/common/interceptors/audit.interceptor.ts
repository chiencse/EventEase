import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface RequestWithUser extends Request {
    user?: {
        username: string;
    };
}
/**
 * Interceptor để tự động ghi nhận thông tin người tạo/cập nhật vào entity.
 * 
 * Hoạt động:
 * - Lấy thông tin username từ request.user (được set bởi JWT middleware)
 * - Với request POST: gán username vào createdBy và updatedBy
 * - Với request PATCH/PUT: gán username vào updatedBy
 * - Nếu không có user, mặc định là 'system'
 * 
 * Sử dụng:
 * - Đăng ký global trong AppModule hoặc module cụ thể
 * - Các entity cần có các trường createdBy và updatedBy
 */

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const username = request.user?.username || 'system';

        return next.handle().pipe(
            tap(() => {
                // Lấy entity từ request
                const entity = request.body;
                if (entity) {
                    // Nếu là request tạo mới
                    if (request.method === 'POST') {
                        entity.createdBy = username;
                        entity.updatedBy = username;
                    }
                    // Nếu là request cập nhật
                    else if (request.method === 'PATCH' || request.method === 'PUT') {
                        entity.updatedBy = username;
                    }
                }
            }),
        );
    }
} 