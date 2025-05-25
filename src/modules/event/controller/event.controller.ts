import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseInterceptors,
    UploadedFiles,
    ParseIntPipe,
    HttpStatus,
    UseGuards,
    Query,
    BadRequestException,
    Req,
} from '@nestjs/common';
import { EventService } from '../service/event.service';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IResponse } from 'src/common/interfaces/response.interface';
import { EventResponseDto } from '../dto/response/event-response.dto';
import { IEvent } from '../interfaces/event.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';
import { getUserId } from 'src/common/utils/user.util';

@Controller('events')
@ApiTags('Events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    /**
     * Tạo mới một sự kiện
     * @param createEventDto - Dữ liệu tạo sự kiện
     * @param files - Danh sách ảnh đính kèm
     * @returns Thông tin sự kiện đã tạo
     */
    @Post()
    @ApiOperation({ summary: 'Tạo mới sự kiện' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateEventDto, description: 'Dữ liệu tạo sự kiện mới' })
    @ApiResponse({ status: 201, description: 'Tạo sự kiện thành công', type: EventResponseDto })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @UseInterceptors(FilesInterceptor('images'))
    async create( @Body() createEventDto: CreateEventDto, @UploadedFiles() files: any[],
    ): Promise<IResponse<EventResponseDto | null>> {
        createEventDto.images = files;
        return this.eventService.create(createEventDto);
    }

    /**
     * Lấy danh sách tất cả sự kiện
     * @returns Danh sách sự kiện
     */
    // @Get()
    // @ApiOperation({ summary: 'Lấy danh sách tất cả sự kiện' })
    // @ApiResponse({
    //     status: 200,
    //     description: 'Lấy danh sách sự kiện thành công',
    //     type: [EventResponseDto]
    // })
    // @ApiResponse({
    //     status: 401,
    //     description: 'Không có quyền truy cập'
    // })
    // async findAll(): Promise<IResponse<EventResponseDto[] | null>> {
    //     return this.eventService.findAll();
    // }

    /**
     * Lấy danh sách sự kiện của người dùng hiện tại
     * @param request - Request với thông tin người dùng
     * @param page - Số trang (mặc định: 1)
     * @param limit - Số lượng sự kiện mỗi trang (mặc định: 10)
     * @returns Danh sách sự kiện và thông tin phân trang
     */
    @Get('my-events')
    @ApiOperation({ summary: 'Lấy danh sách sự kiện của người dùng hiện tại' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng sự kiện mỗi trang (mặc định: 10)' })
    @ApiResponse({ status: 200, description: 'Lấy danh sách sự kiện thành công' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async findMyEvents(
        @Req() request: RequestWithUser,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ): Promise<IResponse<{
        items: EventResponseDto[];
        meta: {
            totalItems: number;
            itemCount: number;
            itemsPerPage: number;
            totalPages: number;
            currentPage: number;
        };
    }>> {
        const userId = await getUserId(request);
        const parsedPage = isNaN(Number(page)) ? 1 : Number(page);
        const parsedLimit = isNaN(Number(limit)) ? 10 : Number(limit);

        // Thêm xác thực để đảm bảo giá trị hợp lệ
        if (parsedPage < 1) throw new BadRequestException('Số trang phải lớn hơn 0');
        if (parsedLimit < 1) throw new BadRequestException('Số lượng sự kiện mỗi trang phải lớn hơn 0');

        return this.eventService.findMyEvents(
            userId,
            parsedPage,
            parsedLimit
        );
    }

    /**
     * Lấy thông tin chi tiết sự kiện
     * @param id - ID của sự kiện
     * @returns Thông tin sự kiện
     */
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin chi tiết sự kiện' })
    @ApiParam({ name: 'id', description: 'ID của sự kiện', type: 'string', format: 'uuid'  })
    @ApiResponse({ status: 200, description: 'Lấy thông tin sự kiện thành công', type: EventResponseDto })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sự kiện' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async findOne(
        @Param('id') id: string,
    ): Promise<IResponse<EventResponseDto | null>> {
        return this.eventService.findOne(id);
    }

    /**
     * Cập nhật thông tin sự kiện
     * @param id - ID của sự kiện
     * @param updateEventDto - Dữ liệu cập nhật
     * @param files - Danh sách ảnh mới (nếu có)
     * @returns Thông tin sự kiện sau khi cập nhật
     */
    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin sự kiện' })
    @ApiConsumes('multipart/form-data')
    @ApiParam({ name: 'id', description: 'ID của sự kiện cần cập nhật', type: 'string', format: 'uuid' })
    @ApiBody({ type: UpdateEventDto, description: 'Dữ liệu cập nhật sự kiện' })
    @ApiResponse({ status: 200, description: 'Cập nhật sự kiện thành công', type: EventResponseDto })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sự kiện' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    @UseInterceptors(FilesInterceptor('images'))
    async update(
        @Param('id') id: string,
        @Body() updateEventDto: UpdateEventDto,
        @UploadedFiles() files: any[],
    ): Promise<IResponse<EventResponseDto | null>> {
        updateEventDto.images = files;
        return this.eventService.update(id, updateEventDto as IEvent);
    }

    /**
     * Xóa một sự kiện
     * @param id - ID của sự kiện
     * @returns Kết quả xóa
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Xóa sự kiện' })
    @ApiParam({ name: 'id', description: 'ID của sự kiện cần xóa', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Xóa sự kiện thành công',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'object',
                    properties: {
                        deleted: {
                            type: 'boolean',
                            example: true
                        }
                    }
                },
                message: {
                    type: 'string',
                    example: 'Xóa sự kiện thành công'
                },
                statusCode: {
                    type: 'number',
                    example: 200
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sự kiện' })
    @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
    async remove(
        @Param('id') id: string,
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        return this.eventService.remove(id);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách sự kiện có phân trang' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng sự kiện mỗi trang (mặc định: 10)' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Từ khóa tìm kiếm theo tên sự kiện' })
    async findAllWithPagination(
        @Query('page') page: string = '1', // Nhận dưới dạng chuỗi
        @Query('limit') limit: string = '10', // Nhận dưới dạng chuỗi
        @Query('search') search?: string
    ): Promise<IResponse<{
        items: EventResponseDto[];
        meta: {
            totalItems: number;
            itemCount: number;
            itemsPerPage: number;
            totalPages: number;
            currentPage: number;
        };
    }>> {
        const parsedPage = isNaN(Number(page)) ? 1 : Number(page);
        const parsedLimit = isNaN(Number(limit)) ? 10 : Number(limit);

        // Thêm xác thực để đảm bảo giá trị hợp lệ
        if (parsedPage < 1) throw new BadRequestException('Số trang phải lớn hơn 0');
        if (parsedLimit < 1) throw new BadRequestException('Số lượng sự kiện mỗi trang phải lớn hơn 0');

        return this.eventService.findAllWithPagination(
            parsedPage,
            parsedLimit,
            search
        );
    }
}