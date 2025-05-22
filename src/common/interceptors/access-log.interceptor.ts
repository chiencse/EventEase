import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor ghi log cho mọi request/response trong hệ thống
 * - Ghi log request: headers, body, query params
 * - Ghi log response: status code, response time, data
 * - Ghi log error: error message, stack trace
 * - Tự động loại bỏ thông tin nhạy cảm
 */
@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
    /**
     * Xử lý và ghi log cho mỗi request
     * @param context - ExecutionContext chứa thông tin request/response
     * @param next - CallHandler để xử lý request tiếp theo
     * @returns Observable chứa response data
     */
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const startTime = Date.now();

        // Ghi log request
        const requestLog = {
            timestamp: new Date().toISOString(),
            type: 'REQUEST',
            ipAddress: this.getIpAddress(request),
            method: request.method,
            url: request.originalUrl,
            headers: this.sanitizeHeaders(request.headers),
            query: request.query,
            body: this.sanitizeBody(request.body),
            userAgent: request.headers['user-agent'],
        };
        console.log(JSON.stringify(requestLog, null, 2));

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    // Ghi log response
                    const responseLog = {
                        timestamp: new Date().toISOString(),
                        type: 'RESPONSE',
                        ipAddress: this.getIpAddress(request),
                        method: request.method,
                        url: request.originalUrl,
                        statusCode: response.statusCode,
                        responseTime: `${responseTime}ms`,
                        responseData: this.sanitizeResponse(data),
                    };
                    console.log(JSON.stringify(responseLog, null, 2));
                },
                error: (error) => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    // Ghi log error
                    const errorLog = {
                        timestamp: new Date().toISOString(),
                        type: 'ERROR',
                        ipAddress: this.getIpAddress(request),
                        method: request.method,
                        url: request.originalUrl,
                        statusCode: error.status || 500,
                        responseTime: `${responseTime}ms`,
                        error: {
                            message: error.message,
                            stack: error.stack,
                        },
                    };
                    console.log(JSON.stringify(errorLog, null, 2));
                },
            }),
        );
    }

    /**
     * Lấy địa chỉ IP của client từ request
     * - Kiểm tra header X-Forwarded-For
     * - Fallback về request.ip hoặc remoteAddress
     * @param request - Express Request object
     * @returns Địa chỉ IP của client
     */
    private getIpAddress(request: Request): string {
        const forwardedFor = request.headers['x-forwarded-for'];
        if (forwardedFor) {
            return Array.isArray(forwardedFor) 
                ? forwardedFor[0] 
                : forwardedFor.split(',')[0].trim();
        }
        return request.ip || request.socket.remoteAddress || 'unknown';
    }

    /**
     * Loại bỏ các header nhạy cảm trước khi ghi log
     * - Xóa authorization token
     * - Xóa cookie
     * @param headers - Headers từ request
     * @returns Headers đã được làm sạch
     */
    private sanitizeHeaders(headers: any): any {
        const sanitized = { ...headers };
        // Loại bỏ các header nhạy cảm
        delete sanitized.authorization;
        delete sanitized.cookie;
        return sanitized;
    }

    /**
     * Loại bỏ thông tin nhạy cảm trong body request
     * - Xóa password
     * - Xóa token
     * @param body - Body từ request
     * @returns Body đã được làm sạch
     */
    private sanitizeBody(body: any): any {
        if (!body) return body;
        const sanitized = { ...body };
        // Loại bỏ các thông tin nhạy cảm
        delete sanitized.password;
        delete sanitized.token;
        return sanitized;
    }

    /**
     * Giới hạn kích thước response data trước khi ghi log
     * - Kiểm tra độ dài JSON string
     * - Trả về thông báo nếu quá lớn
     * @param data - Response data
     * @returns Data đã được xử lý
     */
    private sanitizeResponse(data: any): any {
        if (!data) return data;
        // Giới hạn kích thước response để tránh log quá lớn
        return JSON.stringify(data).length > 1000 
            ? 'Response too large to log' 
            : data;
    }
} 