import { Controller, Get, Post, Body, Delete, Param, ParseIntPipe, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ParticipatedEventService } from '../service/participated-event.service';
import { CreateParticipatedEventDto } from '../dto/participated-event.dto';
import { ParticipatedEventResponseDto } from '../dto/participated-event-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';

@Controller('participated-events')
@ApiTags('Participated Events')
@ApiBearerAuth('JWT-auth')
// @UseGuards(AuthGuard)
export class ParticipatedEventController {
    constructor(private readonly participatedEventService: ParticipatedEventService) {}

    /**
     * Tạo mới một sự kiện tham gia
     * @param createParticipatedEventDto - Dữ liệu tạo sự kiện tham gia
     * @returns Thông tin sự kiện tham gia đã tạo
     */
    @Post()
    async create(
        @Body() createParticipatedEventDto: CreateParticipatedEventDto
    ): Promise<IResponse<ParticipatedEventResponseDto | null>> {
        return this.participatedEventService.create(createParticipatedEventDto);
    }

    /**
     * Xóa một sự kiện tham gia
     * @param id - ID của sự kiện tham gia
     * @returns Kết quả xóa
     */
    @Delete(':id')
    async remove(
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        return this.participatedEventService.remove(id);
    }

    /**
     * Kiểm tra xem người dùng đã tham gia sự kiện chưa
     * @param userId - ID của người dùng
     * @param eventId - ID của sự kiện
     * @returns Trạng thái tham gia
     */
    @Get('check')
    async isEventParticipated(
        @Query('userId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) userId: number,
        @Query('eventId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) eventId: number
    ): Promise<IResponse<{ isParticipated: boolean } | null>> {
        return this.participatedEventService.isEventParticipated(userId, eventId);
    }

    /**
     * Lấy số lượng người tham gia một sự kiện
     * @param eventId - ID của sự kiện
     * @returns Số lượng người tham gia
     */
    @Get('count/:eventId')
    async getEventParticipantsCount(
        @Param('eventId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) eventId: number
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
        @Param('userId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) userId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: ParticipatedEventResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.participatedEventService.findAllByUserIdPaginated(userId, page, limit);
    }
} 