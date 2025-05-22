import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware này dùng để lưu request vào global context
 * Mục đích: Cho phép các entity kế thừa từ AuditEntity có thể truy cập request
 * để lấy thông tin user (id) và tự động set vào createdBy/updatedBy
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    (global as any).request = req;
    next();
  }
} 