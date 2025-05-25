import { Controller, Get, Post, Body, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FavouriteEventService } from '../service/favourite-event.service';
import { CreateFavouriteEventDto } from '../dto/favourite-event.dto';
import { EventFavouriteResponseDto, UserFavouriteEventsResponseDto } from '../dto/favourite-event-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';
import { getUserId } from 'src/common/utils/user.util';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('favourite-events')
@ApiTags('Favourite Events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class FavouriteEventController {
    constructor(private readonly favouriteEventService: FavouriteEventService) {}

    @Post()
    @ApiOperation({
        summary: 'Thêm sự kiện vào danh sách yêu thích',
        description: 'Cho phép người dùng thêm một sự kiện vào danh sách yêu thích. Hệ thống sẽ kiểm tra xem người dùng đã thêm chưa trước khi tạo bản ghi mới.'
    })
    @ApiResponse({
        status: 201,
        description: 'Thêm vào danh sách yêu thích thành công',
        type: EventFavouriteResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Người dùng đã thêm sự kiện này vào danh sách yêu thích'
    })
    async create(
        @Body() createFavouriteEventDto: CreateFavouriteEventDto,
        @Req() request: RequestWithUser
    ): Promise<IResponse<EventFavouriteResponseDto | null>> {
        const userId = await getUserId(request);
        return this.favouriteEventService.create(userId, createFavouriteEventDto);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa sự kiện khỏi danh sách yêu thích',
        description: 'Cho phép người dùng xóa một sự kiện khỏi danh sách yêu thích.'
    })
    @ApiParam({
        name: 'id',
        description: 'ID của bản ghi yêu thích sự kiện',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Xóa khỏi danh sách yêu thích thành công'
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy thông tin yêu thích sự kiện'
    })
    async remove(
        @Param('id') id: string
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        return this.favouriteEventService.remove(id);
    }

    @Get('check/:eventId')
    @ApiOperation({
        summary: 'Kiểm tra trạng thái yêu thích',
        description: 'Kiểm tra xem người dùng hiện tại đã thêm sự kiện vào danh sách yêu thích hay chưa.'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần kiểm tra',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về trạng thái yêu thích của người dùng',
        schema: {
            properties: {
                isFavourited: {
                    type: 'boolean',
                    description: 'true nếu đã yêu thích, false nếu chưa yêu thích'
                }
            }
        }
    })
    async isEventFavourited(
        @Param('eventId') eventId: string,
        @Req() request: RequestWithUser
    ): Promise<IResponse<{ isFavourited: boolean } | null>> {
        const userId = await getUserId(request);
        return this.favouriteEventService.isEventFavourited(userId, eventId);
    }

    @Get('count/:eventId')
    @ApiOperation({
        summary: 'Lấy số lượng người yêu thích',
        description: 'Lấy tổng số người đã thêm một sự kiện vào danh sách yêu thích.'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần lấy số lượng người yêu thích',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về số lượng người yêu thích',
        schema: {
            properties: {
                count: {
                    type: 'number',
                    description: 'Số lượng người yêu thích sự kiện'
                }
            }
        }
    })
    async getEventFavouritesCount(
        @Param('eventId') eventId: string
    ): Promise<IResponse<{ count: number } | null>> {
        return this.favouriteEventService.getEventFavouritesCount(eventId);
    }

    @Get('my-events')
    @ApiOperation({
        summary: 'Lấy danh sách sự kiện yêu thích',
        description: 'Lấy danh sách các sự kiện mà người dùng hiện tại đã thêm vào danh sách yêu thích, có phân trang.'
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
        description: 'Trả về danh sách sự kiện yêu thích',
        type: UserFavouriteEventsResponseDto
    })
    async getMyFavouriteEvents(
        @Req() request: RequestWithUser,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ events: UserFavouriteEventsResponseDto[], total: number, page: number, limit: number } | null>> {
        const userId = await getUserId(request);
        return this.favouriteEventService.findAllByUserIdPaginated(userId, page, limit);
    }

    @Get('event/:eventId/favourites')
    @ApiOperation({
        summary: 'Lấy danh sách người yêu thích',
        description: 'Lấy danh sách tất cả người đã thêm một sự kiện vào danh sách yêu thích, có phân trang.'
    })
    @ApiParam({
        name: 'eventId',
        description: 'ID của sự kiện cần lấy danh sách người yêu thích',
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
        description: 'Trả về danh sách người yêu thích sự kiện',
        type: EventFavouriteResponseDto
    })
    async getEventFavourites(
        @Param('eventId') eventId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: EventFavouriteResponseDto[], total: number, page: number, limit: number } | null>> {
        return this.favouriteEventService.getEventFavourites(eventId, page, limit);
    }
} 