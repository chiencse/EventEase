import { Controller, Get, Post, Body, Delete, Param, ParseIntPipe, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { FavouriteEventService } from '../service/favourite-event.service';
import { CreateFavouriteEventDto } from '../dto/favourite-event.dto';
import { FavouriteEventResponseDto } from '../dto/favourite-event-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('favourite-events')
@ApiTags('Favourite Events')
@ApiBearerAuth()
// @UseGuards(AuthGuard)
export class FavouriteEventController {
    constructor(private readonly favouriteEventService: FavouriteEventService) {}

    /**
     * Tạo mới một sự kiện yêu thích
     * @param createFavouriteEventDto - Dữ liệu tạo sự kiện yêu thích
     * @returns Thông tin sự kiện yêu thích đã tạo
     */
    @Post()
    async create(
        @Body() createFavouriteEventDto: CreateFavouriteEventDto
    ): Promise<IResponse<FavouriteEventResponseDto | null>> {
        return this.favouriteEventService.create(createFavouriteEventDto);
    }

    /**
     * Xóa một sự kiện yêu thích
     * @param id - ID của sự kiện yêu thích
     * @returns Kết quả xóa
     */
    @Delete(':id')
    async remove(
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        return this.favouriteEventService.remove(id);
    }

    /**
     * Kiểm tra xem người dùng đã yêu thích sự kiện chưa
     * @param userId - ID của người dùng
     * @param eventId - ID của sự kiện
     * @returns Trạng thái yêu thích
     */
    @Get('check')
    async isEventFavourited(
        @Query('userId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) userId: number,
        @Query('eventId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) eventId: number
    ): Promise<IResponse<{ isFavourited: boolean } | null>> {
        return this.favouriteEventService.isEventFavourited(userId, eventId);
    }

    /**
     * Lấy số lượng người yêu thích một sự kiện
     * @param eventId - ID của sự kiện
     * @returns Số lượng người yêu thích
     */
    @Get('count/:eventId')
    async getEventFavouritesCount(
        @Param('eventId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) eventId: number
    ): Promise<IResponse<{ count: number } | null>> {
        return this.favouriteEventService.getEventFavouritesCount(eventId);
    }

    /**
     * Lấy danh sách sự kiện yêu thích của một người dùng với phân trang
     * @param userId - ID của người dùng
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách sự kiện yêu thích đã phân trang
     */
    @Get('user/:userId')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAllByUserIdPaginated(
        @Param('userId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) userId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: FavouriteEventResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.favouriteEventService.findAllByUserIdPaginated(userId, page, limit);
    }
} 