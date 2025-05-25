import { IResponse } from '../interfaces/response.interface';

export class ResponseUtil {

    /**
     * Trả về response thành công
     * @param data - Dữ liệu trả về
     * @param message - Thông báo
     * @param code - Mã lỗi
     * @returns Response
     */
    static success<T>(data: T, message: string = 'Thành công', code: number = 200): IResponse<T> {
        return {
            status: true,
            code,
            timestamp: new Date().toISOString(),
            message,
            data
        };
    }

    /**
     * Trả về response lỗi
     * @param message - Thông báo
     * @param code - Mã lỗi
     * @returns Response
     */ 
    static error(message: string = 'Có lỗi xảy ra', code: number = 500): IResponse<null> {
        return {
            status: false,
            code,
            timestamp: new Date().toISOString(),
            message,
            data: null
        };
    }
} 