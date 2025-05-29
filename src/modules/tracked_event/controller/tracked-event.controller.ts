import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { TrackedEventService } from '../service/tracked-event.service';
import { CreateTrackedEventDto } from '../dto/tracked-event.dto';
import { EventTrackedResponseDto, UserTrackedEventsResponseDto } from '../dto/tracked-event-response.dto';
import { IResponse } from 'src/common/interfaces/response.interface';
import { getUserId } from 'src/common/utils/user.util';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';


@ApiTags('Tracked Events')
@Controller('tracked-events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TrackedEventController {
    constructor(private readonly trackedEventService: TrackedEventService) {}

    @Post()
    @ApiOperation({
        summary: 'Thêm sự kiện vào danh sách theo dõi',
        description: 'Cho phép người dùng theo dõi một sự kiện và kiểm tra xem họ đã theo dõi chưa'
    })
    @ApiResponse({
        status: 201,
        description: 'Thêm vào danh sách theo dõi thành công',
        type: EventTrackedResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Bạn đã theo dõi sự kiện này rồi'
    })
    async create(
        @Req() req: any,
        @Body() createTrackedEventDto: CreateTrackedEventDto
    ): Promise<IResponse<EventTrackedResponseDto | null>> {
        const userId = await getUserId(req);
        return this.trackedEventService.create(userId, createTrackedEventDto);
    }

    @Delete(':eventId')
    @ApiOperation({ summary: 'Xóa sự kiện khỏi danh sách theo dõi' })
    @ApiResponse({ status: 200, description: 'Xóa thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy thông tin theo dõi' })
    async remove(
        @Req() request: RequestWithUser,
        @Param('eventId') eventId: string
    ): Promise<IResponse<{deleted: boolean} | null>> {
        const userId = await getUserId(request);
        return this.trackedEventService.remove(userId, eventId);
    }

    @Get('check/:eventId')
    @ApiOperation({
        summary: 'Kiểm tra trạng thái theo dõi sự kiện',
        description: 'Kiểm tra xem người dùng đã theo dõi sự kiện này chưa'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần kiểm tra'
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về trạng thái theo dõi',
        schema: {
            type: 'object',
            properties: {
                isTracked: {
                    type: 'boolean',
                    example: true
                }
            }
        }
    })
    async isEventTracked(
        @Req() req: any,
        @Param('eventId') eventId: string
    ): Promise<IResponse<{ isTracked: boolean } | null>> {
        const userId = await getUserId(req);
        return this.trackedEventService.isEventTracked(userId, eventId);
    }

    @Get('count/:eventId')
    @ApiOperation({
        summary: 'Lấy số lượng người theo dõi sự kiện',
        description: 'Lấy tổng số người đang theo dõi một sự kiện'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần lấy số lượng người theo dõi'
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về số lượng người theo dõi',
        schema: {
            type: 'object',
            properties: {
                count: {
                    type: 'number',
                    example: 100
                }
            }
        }
    })
    async getEventTrackedCount(
        @Param('eventId') eventId: string
    ): Promise<IResponse<{ count: number } | null>> {
        return this.trackedEventService.getEventTrackedCount(eventId);
    }

    @Get('my-events')
    @ApiOperation({
        summary: 'Lấy danh sách sự kiện đang theo dõi',
        description: 'Lấy danh sách các sự kiện mà người dùng đang theo dõi'
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Số trang (mặc định: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Số lượng item trên mỗi trang (mặc định: 10)'
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về danh sách sự kiện đang theo dõi',
        type: UserTrackedEventsResponseDto
    })
    async getMyTrackedEvents(
        @Req() req: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ): Promise<IResponse<{ events: UserTrackedEventsResponseDto[], total: number, page: number, limit: number } | null>> {
        const userId = await getUserId(req);
        return this.trackedEventService.findAllByUserIdPaginated(userId, page, limit);
    }

    @Get('event/:eventId/trackers')
    @ApiOperation({
        summary: 'Lấy danh sách người theo dõi sự kiện',
        description: 'Lấy danh sách những người đang theo dõi một sự kiện'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần lấy danh sách người theo dõi'
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Số trang (mặc định: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Số lượng item trên mỗi trang (mặc định: 10)'
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về danh sách người theo dõi',
        type: EventTrackedResponseDto
    })
    async getEventTrackers(
        @Param('eventId') eventId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ): Promise<IResponse<{ data: EventTrackedResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.trackedEventService.getEventTracked(eventId, page, limit);
    }
} 