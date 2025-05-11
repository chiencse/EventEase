// src/modules/event/dto/create-event.dto.ts
import { IsString, IsInt, IsDate, Min, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import * as moment from 'moment';
import { IEvent } from '../../interfaces/event.interface';

import { File as MulterFile } from 'multer';

export class CreateEventDto implements IEvent {
  @ApiProperty({ example: 'Hội thảo AI' })
  @IsString({ message: 'Tiêu đề phải là chuỗi.' })
  title: string;

  @ApiProperty({ example: 'Sự kiện dành cho sinh viên ngành AI' })
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  description: string;

  @ApiProperty({ example: '05/06/2025 09:00' })
  @Transform(({ value }) => {
    const date = moment(value, 'DD/MM/YYYY HH:mm', true);
    return date.isValid() ? date.toDate() : value;
  })
  @IsDate({ message: 'Thời gian bắt đầu phải đúng định dạng dd/MM/yyyy HH:mm' })
  startTime: Date;

  @ApiProperty({ example: '05/06/2025 12:00' })
  @Transform(({ value }) => {
    const date = moment(value, 'DD/MM/YYYY HH:mm', true);
    return date.isValid() ? date.toDate() : value;
  })
  @IsDate({ message: 'Thời gian kết thúc phải đúng định dạng dd/MM/yyyy HH:mm' })
  endTime: Date;

  @ApiProperty({ example: 'tech' })
  @IsString({ message: 'Tag phải là chuỗi.' })
  tag: string;

  @ApiProperty({ example: 100 })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: 'Số lượng người tham gia phải là số nguyên.' })
  @Min(1, { message: 'Số lượng người tham gia phải lớn hơn 0.' })
  @Type(() => Number)
  participantNumber: number;

  @ApiProperty({ example: 'Phòng A1.01, ĐH Bách Khoa' })
  @IsString({ message: 'Vị trí phải là chuỗi.' })
  position: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsArray()
  @IsOptional()
  images?: MulterFile[];
}
