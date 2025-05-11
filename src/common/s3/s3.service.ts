// src/common/services/s3.service.ts
import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { File as MulterFile } from 'multer';

/**
 * Service để upload và xóa file từ S3.
 * Dùng SDK v2 (aws-sdk), không sử dụng ACL do Bucket Ownership là `bucket-owner-enforced`.
 */
@Injectable()
export class S3Service {
  private s3: S3;

  constructor(private configService: ConfigService) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;

    if (!accessKeyId || !secretAccessKey || !region) {
      throw new Error('AWS credentials are not configured');
    }

    this.s3 = new S3({
      accessKeyId,
      secretAccessKey,
      region,
    });
  }

  /**
   * Upload nhiều file lên S3 cùng lúc
   * @param files - Danh sách file từ Multer
   * @param folder - Thư mục lưu trong bucket
   * @returns Danh sách URL công khai
   */
  async uploadBatch(files: MulterFile[], folder: string): Promise<string[]> {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    try {
      const uploadPromises = files.map(file => {
        const timestamp = Date.now();
        const key = `${folder}/${timestamp}-${file.originalname}`;
        
        const params: S3.PutObjectRequest = {
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        return this.s3.putObject(params).promise()
          .then(() => this.getFileUrl(key));
      });

      return await Promise.all(uploadPromises);
    } catch (error: any) {
      console.error('S3 batch upload error:', error);
      throw new Error(`Failed to upload files to S3: ${error.message}`);
    }
  }

  /**
   * Upload một file lên S3
   * @param file - File từ Multer
   * @param folder - Thư mục lưu trong bucket
   * @returns URL công khai
   */
  async uploadFile(file: MulterFile, folder: string): Promise<string> {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    const timestamp = Date.now();
    const key = `${folder}/${timestamp}-${file.originalname}`;

    const params: S3.PutObjectRequest = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.putObject(params).promise();
      return this.getFileUrl(key);
    } catch (error: any) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Xóa nhiều file khỏi S3 cùng lúc
   * @param fileUrls - Danh sách URL cần xóa
   */
  async deleteBatch(fileUrls: string[]): Promise<void> {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    try {
      const deletePromises = fileUrls.map(fileUrl => {
        const urlPrefix = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
        const key = fileUrl.replace(urlPrefix, '');

        const params: S3.DeleteObjectRequest = {
          Bucket: bucket,
          Key: key,
        };

        return this.s3.deleteObject(params).promise();
      });

      await Promise.all(deletePromises);
    } catch (error: any) {
      console.error('S3 batch delete error:', error);
      throw new Error(`Failed to delete files from S3: ${error.message}`);
    }
  }

  /**
   * Xóa một file khỏi S3
   * @param fileUrl - URL cần xóa
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    const urlPrefix = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    const key = fileUrl.replace(urlPrefix, '');

    const params: S3.DeleteObjectRequest = {
      Bucket: bucket,
      Key: key,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error: any) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Tạo URL public cho file từ key
   */
  private getFileUrl(key: string): string {
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
}
