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
} from '@nestjs/common';
import { EventService } from '../service/event.service';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IResponse } from 'src/common/interfaces/response.interface';
import { EventResponseDto } from '../dto/response/event-response.dto';
import { IEvent } from '../interfaces/event.interface';

@Controller('events')
@ApiTags('Events')
@ApiBearerAuth()
export class EventController {
    constructor(private readonly eventService: EventService) {}

    /**
     * Tạo mới một sự kiện
     * @param createEventDto - Dữ liệu tạo sự kiện
     * @param files - Danh sách ảnh đính kèm
     * @returns Thông tin sự kiện đã tạo
     */
    @Post()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: CreateEventDto,
    })
    @UseInterceptors(FilesInterceptor('images'))
    async create(
        @Body() createEventDto: CreateEventDto,
        @UploadedFiles() files: any[],
    ): Promise<IResponse<EventResponseDto | null>> {
        createEventDto.images = files;
        return this.eventService.create(createEventDto);
    }

    /**
     * Lấy danh sách tất cả sự kiện
     * @returns Danh sách sự kiện
     */
    @Get()
    async findAll(): Promise<IResponse<EventResponseDto[] | null>> {
        return this.eventService.findAll();
    }

    /**
     * Lấy thông tin chi tiết một sự kiện
     * @param id - ID của sự kiện
     * @returns Thông tin chi tiết sự kiện
     */
    @Get(':id')
    async findOne(
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
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
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: UpdateEventDto,
    })
    @UseInterceptors(FilesInterceptor('images'))
    async update(
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
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
    async remove(
        @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    ): Promise<IResponse<{ deleted: boolean } | null>> {
        return this.eventService.remove(id);
    }
}