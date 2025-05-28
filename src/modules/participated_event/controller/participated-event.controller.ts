import { Controller, Get, Post, Body, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ParticipatedEventService } from '../service/participated-event.service';
import { CreateParticipatedEventDto } from '../dto/participated-event.dto';
import { EventParticipantResponseDto, UserParticipatedEventsResponseDto } from '../dto/event-participant-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';
import { getUserId } from 'src/common/utils/user.util';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('participated-events')
@ApiTags('Participated Events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ParticipatedEventController {
    constructor(private readonly participatedEventService: ParticipatedEventService) {}

    /**
     * Đăng ký tham gia sự kiện
     * @param createParticipatedEventDto - Dữ liệu đăng ký tham gia
     * @param request - Request chứa thông tin người dùng
     * @returns Thông tin xác nhận đăng ký
     */
    @Post()
    @ApiOperation({
        summary: 'Đăng ký tham gia sự kiện',
        description: 'Cho phép người dùng đăng ký tham gia một sự kiện. Hệ thống sẽ kiểm tra xem người dùng đã đăng ký chưa trước khi tạo bản ghi mới.'
    })
    @ApiResponse({
        status: 201,
        description: 'Đăng ký tham gia thành công',
        type: EventParticipantResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Người dùng đã đăng ký tham gia sự kiện này'
    })
    async create(
        @Body() createParticipatedEventDto: CreateParticipatedEventDto,
        @Req() request: RequestWithUser
    ): Promise<IResponse<EventParticipantResponseDto | null>> {
        const userId = await getUserId(request);
        return this.participatedEventService.create(userId, createParticipatedEventDto);
    }

    /**
     * Hủy tham gia sự kiện
     * @param eventId - ID của bản ghi tham gia
     * @returns Kết quả hủy tham gia
     */
    @Delete(':eventId')
    @ApiOperation({ summary: 'Hủy tham gia sự kiện' })
    @ApiResponse({ status: 200, description: 'Hủy tham gia thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy thông tin tham gia' })
    async remove(
        @Req() request: RequestWithUser,
        @Param('eventId') eventId: string
    ): Promise<IResponse<{deleted: boolean} | null>> {
        const userId = await getUserId(request);
        return this.participatedEventService.remove(userId, eventId);
    }

    /**
     * Kiểm tra trạng thái tham gia sự kiện
     * @param eventId - ID của sự kiện
     * @param request - Request chứa thông tin người dùng
     * @returns Trạng thái tham gia
     */
    @Get('check/:eventId')
    @ApiOperation({
        summary: 'Kiểm tra trạng thái tham gia',
        description: 'Kiểm tra xem người dùng hiện tại đã tham gia sự kiện hay chưa.'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần kiểm tra',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về trạng thái tham gia của người dùng',
        schema: {
            properties: {
                isParticipated: {
                    type: 'boolean',
                    description: 'true nếu đã tham gia, false nếu chưa tham gia'
                }
            }
        }
    })
    async isEventParticipated(
        @Param('eventId') eventId: string,
        @Req() request: RequestWithUser
    ): Promise<IResponse<{ isParticipated: boolean } | null>> {
        const userId = await getUserId(request);
        return this.participatedEventService.isEventParticipated(userId, eventId);
    }

    /**
     * Lấy số lượng người tham gia sự kiện
     * @param eventId - ID của sự kiện
     * @returns Số lượng người tham gia
     */
    @Get('count/:eventId')
    @ApiOperation({
        summary: 'Lấy số lượng người tham gia',
        description: 'Lấy tổng số người đã đăng ký tham gia một sự kiện.'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần lấy số lượng người tham gia',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về số lượng người tham gia',
        schema: {
            properties: {
                count: {
                    type: 'number',
                    description: 'Số lượng người tham gia sự kiện'
                }
            }
        }
    })
    async getEventParticipantsCount(
        @Param('eventId') eventId: string
    ): Promise<IResponse<{ count: number } | null>> {
        return this.participatedEventService.getEventParticipantsCount(eventId);
    }

    /**
     * Lấy danh sách sự kiện đã tham gia của người dùng hiện tại
     * @param request - Request chứa thông tin người dùng
     * @returns Danh sách sự kiện đã tham gia
     */
    @Get('my-events')
    @ApiOperation({
        summary: 'Lấy danh sách sự kiện đã tham gia',
        description: 'Lấy danh sách các sự kiện mà người dùng hiện tại đã đăng ký tham gia'
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về danh sách sự kiện đã tham gia',
        type: UserParticipatedEventsResponseDto
    })
    async getMyParticipatedEvents(
        @Req() request: RequestWithUser
    ): Promise<IResponse<UserParticipatedEventsResponseDto[]>> {
        const userId = await getUserId(request);
        return this.participatedEventService.findAllByUserId(userId);
    }

    /**
     * Lấy danh sách người tham gia của một sự kiện
     * @param eventId - ID của sự kiện
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách người tham gia
     */
    @Get('event/:eventId/participants')
    @ApiOperation({
        summary: 'Lấy danh sách người tham gia',
        description: 'Lấy danh sách tất cả người đã đăng ký tham gia một sự kiện, có phân trang.'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần lấy danh sách người tham gia',
        type: String
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
        description: 'Trả về danh sách người tham gia sự kiện',
        type: EventParticipantResponseDto
    })
    async getEventParticipants(
        @Param('eventId') eventId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: EventParticipantResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.participatedEventService.getEventParticipants(eventId, page, limit);
    }
} 