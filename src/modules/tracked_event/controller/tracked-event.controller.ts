import { Controller, Get, Post, Body, Delete, Param, ParseIntPipe, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { TrackedEventService } from '../service/tracked-event.service';
import { CreateTrackedEventDto } from '../dto/tracked-event.dto';
import { TrackedEventResponseDto } from '../dto/tracked-event-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';

@Controller('tracked-events')
@ApiTags('Tracked Events')
@ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard)
export class TrackedEventController {
    constructor(private readonly trackedEventService: TrackedEventService) {}

    /**
     * Tạo mới một sự kiện theo dõi
     * @param createTrackedEventDto - Dữ liệu tạo sự kiện theo dõi
     * @returns Thông tin sự kiện theo dõi đã tạo
     */
    @Post()
    async create(
        @Body() createTrackedEventDto: CreateTrackedEventDto
    ): Promise<IResponse<TrackedEventResponseDto | null>> {
        return this.trackedEventService.create(createTrackedEventDto);
    }

    /**
     * Xóa một sự kiện theo dõi
     * @param id - ID của sự kiện theo dõi
     * @returns Kết quả xóa
     */
    @Delete(':id')
    async remove(
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        return this.trackedEventService.remove(id);
    }

    /**
     * Kiểm tra xem người dùng đã theo dõi sự kiện chưa
     * @param userId - ID của người dùng
     * @param eventId - ID của sự kiện
     * @returns Trạng thái theo dõi
     */
    @Get('check')
    async isEventTracked(
        @Query('userId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) userId: number,
        @Query('eventId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) eventId: number
    ): Promise<IResponse<{ isTracked: boolean } | null>> {
        return this.trackedEventService.isEventTracked(userId, eventId);
    }

    /**
     * Lấy số lượng người theo dõi một sự kiện
     * @param eventId - ID của sự kiện
     * @returns Số lượng người theo dõi
     */
    @Get('count/:eventId')
    async getEventTrackersCount(
        @Param('eventId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) eventId: number
    ): Promise<IResponse<{ count: number } | null>> {
        return this.trackedEventService.getEventTrackersCount(eventId);
    }

    /**
     * Lấy danh sách sự kiện theo dõi của một người dùng với phân trang
     * @param userId - ID của người dùng
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách sự kiện theo dõi đã phân trang
     */
    @Get('user/:userId')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAllByUserIdPaginated(
        @Param('userId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) userId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: TrackedEventResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.trackedEventService.findAllByUserIdPaginated(userId, page, limit);
    }
} 