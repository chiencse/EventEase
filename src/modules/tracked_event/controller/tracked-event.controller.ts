import { Controller, Get, Post, Body, Delete, Param, ParseIntPipe, HttpStatus, Query, UseGuards, Req } from '@nestjs/common';
import { TrackedEventService } from '../service/tracked-event.service';
import { CreateTrackedEventDto } from '../dto/tracked-event.dto';
import { TrackedEventResponseDto } from '../dto/tracked-event-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ResponseUtil } from 'src/common/utils/response.util';
import { getUserId } from 'src/common/utils/user.util';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';

@Controller('tracked-events')
@ApiTags('Tracked Events')
@UseGuards(JwtAuthGuard)
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
    async create( @Req() request: RequestWithUser, @Body() createTrackedEventDto: CreateTrackedEventDto
    ): Promise<IResponse<TrackedEventResponseDto | null>> {
        const userId = await getUserId(request); 
        return this.trackedEventService.create(userId, createTrackedEventDto);
    }

    /**
     * Xóa một sự kiện theo dõi
     * @param eventId - ID của sự kiện theo dõi
     * @returns Kết quả xóa
     */
    @Delete(':eventId')
    async remove(
        @Req() request: RequestWithUser,
        @Param('eventId') eventId: string
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        const userId = await getUserId(request); 
        return this.trackedEventService.remove(userId, eventId);
    }

    /**
     * Kiểm tra xem người dùng đã theo dõi sự kiện chưa
     * @param userId - ID của người dùng
     * @param eventId - ID của sự kiện
     * @returns Trạng thái theo dõi
     */
    @Get('check')
    async isEventTracked(
        @Req() request: RequestWithUser,
        @Query('eventId') eventId: string
    ): Promise<IResponse<{ isTracked: boolean } | null>> {
        const userId = await getUserId(request); 
        return this.trackedEventService.isEventTracked(userId, eventId);
    }

    /**
     * Lấy số lượng người theo dõi một sự kiện
     * @param eventId - ID của sự kiện
     * @returns Số lượng người theo dõi
     */
    @Get('count/:eventId')
    async getEventTrackersCount(
        @Param('eventId') eventId: string
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
        @Param('userId') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: TrackedEventResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.trackedEventService.findAllByUserIdPaginated(userId, page, limit);
    }

    /**
     * Lấy danh sách sự kiện đã theo dõi của người dùng hiện tại
     * @param request - Request
     * @param page - Số trang
     * @param limit - Số lượng sự kiện mỗi trang
     * @returns Danh sách sự kiện đã theo dõi đã phân trang
     */
    @Get('my-tracked')
    @ApiOperation({ summary: 'Lấy danh sách sự kiện đã theo dõi của người dùng hiện tại' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng sự kiện mỗi trang (mặc định: 10)' })
    @ApiResponse({
        status: 200,
        description: 'Lấy danh sách sự kiện theo dõi thành công',
        type: TrackedEventResponseDto
    })
    @ApiResponse({
        status: 401,
        description: 'Không có quyền truy cập'
    })
    async getMyTrackedEvents(
        @Req() request: RequestWithUser,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ): Promise<IResponse<{
        data: TrackedEventResponseDto[];
        total: number;
        page: number;
        limit: number;
    } | null>> {
        const userId = await getUserId(request); 
        const parsedPage = parseInt(page) || 1;
        const parsedLimit = parseInt(limit) || 10;

        return this.trackedEventService.findAllByUserIdPaginated(
            userId,
            parsedPage,
            parsedLimit
        );
    }
} 