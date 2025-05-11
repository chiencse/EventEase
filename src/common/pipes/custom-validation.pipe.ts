// common/pipes/custom-validation.pipe.ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
  import { plainToInstance } from 'class-transformer';
  import { validateSync, ValidationError } from 'class-validator';
  import { ValidationException, ValidationErrorItem } from '../exceptions/validation.exception';
  
  /**
   * Pipe tùy chỉnh để validate dữ liệu đầu vào (DTO).
   * 
   * - Chuyển đổi dữ liệu từ dạng thô (JSON) sang class instance
   * - Dùng class-validator để kiểm tra dữ liệu
   * - Trả lỗi dưới dạng có cấu trúc với field, message, và mã lỗi (code)
   */
  @Injectable()
  export class CustomValidationPipe implements PipeTransform {
    /**
     * Phương thức chính được gọi khi pipe xử lý dữ liệu đầu vào.
     * 
     * @param value - Dữ liệu được gửi từ client (body/query/param)
     * @param metatype - Kiểu dữ liệu mong muốn (class DTO)
     * @returns Object đã được kiểm tra và hợp lệ
     * @throws ValidationException nếu có lỗi dữ liệu
     */
    transform(value: any, { metatype }: ArgumentMetadata) {
      if (!metatype || !this.toValidate(metatype)) return value;
  
      // Chuyển đổi JSON thành instance của class DTO
      const object = plainToInstance(metatype, value);
  
      // Kiểm tra dữ liệu bằng class-validator
      const errors = validateSync(object, {
        whitelist: true,              // Loại bỏ các field không có trong DTO
        forbidNonWhitelisted: true,  // Nếu có field lạ thì báo lỗi
      });
  
      if (errors.length > 0) {
        // Nếu có lỗi, ném ra ValidationException có cấu trúc đẹp
        throw new ValidationException(this.formatErrors(errors));
      }
  
      return object;
    }
  
    /**
     * Kiểm tra kiểu dữ liệu có cần validate không (chỉ validate class DTO).
     * 
     * @param metatype - Loại dữ liệu
     * @returns true nếu cần validate, false nếu là kiểu primitive
     */
    private toValidate(metatype: Function): boolean {
      const types: Function[] = [String, Boolean, Number, Array, Object];
      return !types.includes(metatype);
    }
  
    /**
     * Chuyển lỗi thô từ class-validator thành mảng lỗi có field, message, code.
     * 
     * @param errors - Mảng ValidationError từ class-validator
     * @returns Mảng ValidationErrorItem được định dạng đẹp
     */
    private formatErrors(errors: ValidationError[]): ValidationErrorItem[] {
      return errors.flatMap((err) => {
        return Object.entries(err.constraints || {}).map(([constraintKey, message]) => ({
          field: err.property,
          message,
          code: this.mapConstraintToCode(constraintKey), // ánh xạ constraint thành mã lỗi
        }));
      });
    }
  
    /**
     * Ánh xạ tên constraint từ class-validator sang mã lỗi chuẩn hóa.
     * 
     * @param constraint - Tên constraint, ví dụ: isEmail, minLength
     * @returns Mã lỗi tương ứng, ví dụ: INVALID_EMAIL, TOO_SHORT
     */
    private mapConstraintToCode(constraint: string): string {
      const mapping: Record<string, string> = {
        isString: 'INVALID_STRING',
        isEmail: 'INVALID_EMAIL',
        isInt: 'INVALID_INTEGER',
        isDate: 'INVALID_DATE',
        maxLength: 'TOO_LONG',
        minLength: 'TOO_SHORT',
        min: 'TOO_SMALL',
        max: 'TOO_LARGE',
        isEnum: 'INVALID_ENUM',
        isBoolean: 'INVALID_BOOLEAN',
        isNotEmpty: 'REQUIRED_FIELD',
      };
      return mapping[constraint] || 'VALIDATION_ERROR';
    }
  }
  