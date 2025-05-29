import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

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
    @ApiProperty({ description: 'Địa điểm tìm kiếm' })
    @IsString()
    location: string;

    @ApiProperty({ description: 'Bán kính tìm kiếm (km)', default: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    radius?: number = 10;

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