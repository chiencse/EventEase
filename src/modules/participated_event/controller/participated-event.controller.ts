import { Controller, Get, Post, Body, Delete, Param, ParseIntPipe, HttpStatus, Query, UseGuards, Req} from '@nestjs/common';
import { ParticipatedEventService } from '../service/participated-event.service';
import { CreateParticipatedEventDto } from '../dto/participated-event.dto';
import { ParticipatedEventResponseDto } from '../dto/participated-event-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';
import { getUserId} from 'src/common/utils/user.util';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
@Controller('participated-events')
@ApiTags('Participated Events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ParticipatedEventController {
    constructor(private readonly participatedEventService: ParticipatedEventService) {}

    /**
     * Tạo mới một sự kiện tham gia
     * @param createParticipatedEventDto - Dữ liệu tạo sự kiện tham gia
     * @returns Thông tin sự kiện tham gia đã tạo
     */
    @Post()
    async create(
        @Body() createParticipatedEventDto: CreateParticipatedEventDto,
        @Req() request: RequestWithUser
    ): Promise<IResponse<ParticipatedEventResponseDto | null>> {
        const userId = await getUserId(request);
        return this.participatedEventService.create(userId, createParticipatedEventDto);
    }

    /**
     * Xóa một sự kiện tham gia
     * @param id - ID của sự kiện tham gia
     * @returns Kết quả xóa
     */
    @Delete(':id')
    async remove(
        @Param('id') id: number
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        return this.participatedEventService.remove(id);
    }

    /**
     * Kiểm tra xem người dùng đã tham gia sự kiện chưa
     * @param eventId - ID của sự kiện
     * @returns Trạng thái tham gia
     */
    @Get('check')
    async isEventParticipated(
        @Req() request: RequestWithUser,
        @Query('eventId') eventId: string
    ): Promise<IResponse<{ isParticipated: boolean } | null>> {
        const userId = await getUserId(request);
        return this.participatedEventService.isEventParticipated(userId, eventId);
    }

    /**
     * Lấy số lượng người tham gia một sự kiện
     * @param eventId - ID của sự kiện
     * @returns Số lượng người tham gia
     */
    @Get('count/:eventId')
    async getEventParticipantsCount(
        @Param('eventId') eventId: string
    ): Promise<IResponse<{ count: number } | null>> {
        return this.participatedEventService.getEventParticipantsCount(eventId);
    }

    /**
     * Lấy danh sách sự kiện tham gia của một người dùng với phân trang
     * @param userId - ID của người dùng
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách sự kiện tham gia đã phân trang
     */
    @Get('user/:userId')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAllByUserIdPaginated(
        @Req() request: RequestWithUser,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: ParticipatedEventResponseDto[], total: number, page: number, limit: number } | null>> {
        const userId = await getUserId(request);
        return this.participatedEventService.findAllByUserIdPaginated(userId, page, limit);
    }

    /**
     * Lấy danh sách sự kiện tham gia của người dùng hiện tại
     * @param request - Request
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách sự kiện tham gia đã phân trang
     */
    @Get('my-participated')
    async getMyParticipated(
        @Req() request: RequestWithUser,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: ParticipatedEventResponseDto[], total: number, page: number, limit: number } | null>> {  
        const userId = await getUserId(request);
        return this.participatedEventService.findAllByUserIdPaginated(userId, page, limit);
    }

    /**
     * Lấy danh sách người tham gia của một sự kiện
     * @param eventId - ID của sự kiện
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách người tham gia của sự kiện đã phân trang
     */
    @Get('event/:eventId')
    async getEventParticipants(
        @Param('eventId') eventId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: ParticipatedEventResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.participatedEventService.getEventParticipants(eventId, page, limit);
    }

} 