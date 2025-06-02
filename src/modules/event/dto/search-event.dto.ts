import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchEventByKeywordDto {
    @ApiProperty({ description: 'Từ khóa tìm kiếm' })
    @IsString()
    keyword: string;

    @ApiProperty({ description: 'Số trang', default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ description: 'Số lượng item trên mỗi trang', default: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}

export class SearchEventByLocationDto {
    @ApiProperty({ example: 'Quận 7', description: 'Vị trí tìm kiếm' })
    @IsNotEmpty({ message: 'Vị trí không được để trống' })
    @IsString({ message: 'Vị trí phải là chuỗi' })
    location: string;

    @ApiProperty({ example: 10, description: 'Bán kính tìm kiếm (km)', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Bán kính phải là số' })
    @Min(1, { message: 'Bán kính phải lớn hơn hoặc bằng 1' })
    @Max(100, { message: 'Bán kính không được lớn hơn 100' })
    radius?: number;

    @ApiProperty({ example: 1, description: 'Số trang', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Số trang phải là số' })
    @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1' })
    page?: number;

    @ApiProperty({ example: 10, description: 'Số lượng kết quả mỗi trang', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Số lượng kết quả phải là số' })
    @Min(1, { message: 'Số lượng kết quả phải lớn hơn hoặc bằng 1' })
    @Max(100, { message: 'Số lượng kết quả không được lớn hơn 100' })
    limit?: number;
} 