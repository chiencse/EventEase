import { BadRequestException } from '@nestjs/common';
import { IResponse } from '../interfaces/response.interface';
import { ResponseUtil } from '../utils/response.util';

/**
 * Ngoại lệ tùy chỉnh dùng để xử lý lỗi kiểm tra dữ liệu đầu vào (validation).
 *
 * Khi dữ liệu gửi từ client không hợp lệ (vi phạm ràng buộc), hệ thống sẽ ném ra lỗi này,
 * trả về mã trạng thái HTTP 400 cùng danh sách lỗi chi tiết theo từng trường.
 */
export class ValidationException extends BadRequestException {
  /**
   * Danh sách lỗi theo từng trường (field).
   */
  public validationErrors: ValidationErrorItem[];

  /**
   * Khởi tạo đối tượng ValidationException.
   * 
   * @param validationErrors - Mảng các lỗi kiểm tra dữ liệu, mỗi phần tử tương ứng với một trường sai.
   */
  constructor(validationErrors: ValidationErrorItem[]) {
    const response = {
      status: false,
      code: 400,
      path: ResponseUtil['getCurrentPath'](),
      timestamp: new Date().toISOString(),
      message: 'Dữ liệu không hợp lệ',
      data: validationErrors
    } as IResponse<ValidationErrorItem[]>;
    
    super(response);
    this.validationErrors = validationErrors;
  }
}

/**
 * Cấu trúc của một lỗi kiểm tra dữ liệu cho một trường cụ thể.
 */
export interface ValidationErrorItem {
  /**
   * Tên của trường bị lỗi.
   */
  field: string;

  /**
   * Thông báo lỗi tương ứng với trường đó.
   */
  message: string;

  /**
   * (Tùy chọn) Mã lỗi cụ thể, ví dụ: INVALID_EMAIL, TOO_SHORT,...
   */
  code?: string;
}
