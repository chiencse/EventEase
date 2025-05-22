// src/common/interceptors/upload-multiple-images.interceptor.ts
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

/**
 * Interceptor tái sử dụng để nhận nhiều ảnh từ request.
 * Không lưu file, giữ trong bộ nhớ để upload S3 hoặc xử lý riêng.
 * 
 * @param fieldName - Tên trường file (mặc định 'images')
 * @param maxCount - Số ảnh tối đa (mặc định 4)
 */
export function UploadMultipleImages(fieldName = 'images', maxCount = 4) {
  return applyDecorators(
    UseInterceptors(
      FilesInterceptor(fieldName, maxCount, {
        storage: multer.memoryStorage(), // 👈 không lưu file, giữ trên RAM
        limits: {
          fileSize: 20 * 1024 * 1024, // optional: giới hạn 20MB/file
        },
      }),
    ),
  );
}
