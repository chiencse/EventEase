import { IResponse } from '../interfaces/response.interface';

export class ResponseUtil {
    static success<T>(data: T, message: string = 'Thành công', code: number = 200): IResponse<T> {
        return {
            status: true,
            code,
            path: this.getCurrentPath(),
            timestamp: new Date().toISOString(),
            message,
            data
        };
    }

    static error(message: string = 'Có lỗi xảy ra', code: number = 500): IResponse<null> {
        return {
            status: false,
            code,
            path: this.getCurrentPath(),
            timestamp: new Date().toISOString(),
            message,
            data: null
        };
    }

    private static getCurrentPath(): string {
        // Lấy đường dẫn hiện tại từ request
        // Trong thực tế, bạn có thể inject Request object và lấy path từ đó
        return '/api';
    }
} 