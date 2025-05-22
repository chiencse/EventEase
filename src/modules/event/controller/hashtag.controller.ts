import { Controller, Get, Query, Param, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HashtagService } from '../service/hashtag.service';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';
import { HashtagResponseDto } from '../dto/response/hashtag-response.dto';

@ApiTags('Hashtags')
@Controller('hashtags')
export class HashtagController {
    constructor(private readonly hashtagService: HashtagService) {}

    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm hashtags theo từ khóa' })
    @ApiResponse({ status: 200, description: 'Trả về danh sách hashtags phù hợp' })
    async searchHashtags(
        @Query('keyword') keyword: string,
        @Query('limit') limit?: number
    ): Promise<IResponse<HashtagResponseDto[]>> {
        const hashtags = await this.hashtagService.searchHashtags(keyword, limit);
        return ResponseUtil.success(hashtags, 'Tìm kiếm hashtags thành công');
    }

    @Get('popular')
    @ApiOperation({ summary: 'Lấy danh sách hashtags phổ biến' })
    @ApiResponse({ status: 200, description: 'Trả về danh sách hashtags phổ biến' })
    async getPopularHashtags(
        @Query('limit') limit?: number
    ): Promise<IResponse<HashtagResponseDto[]>> {
        const hashtags = await this.hashtagService.getPopularHashtags(limit);
        return ResponseUtil.success(hashtags, 'Lấy danh sách hashtags phổ biến thành công');
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Cập nhật trạng thái của hashtag' })
    @ApiResponse({ status: 200, description: 'Cập nhật trạng thái hashtag thành công' })
    async updateHashtagStatus(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean
    ): Promise<IResponse<void>> {
        await this.hashtagService.updateHashtagStatus(id, isActive);
        return ResponseUtil.success(null, 'Cập nhật trạng thái hashtag thành công');
    }
} 