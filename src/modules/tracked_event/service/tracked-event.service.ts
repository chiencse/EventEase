import { Injectable, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { TrackedEvent } from '../entities/tracked-event.entity';
import { CreateTrackedEventDto } from '../dto/tracked-event.dto';
import { EventTrackedResponseDto, UserTrackedEventsResponseDto } from '../dto/tracked-event-response.dto';
import { TrackedEventMapper } from '../mappers/tracked-event.mapper';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';

@Injectable()
export class TrackedEventService {
    constructor(
        @InjectRepository(TrackedEvent)
        private readonly trackedEventRepository: Repository<TrackedEvent>,
    ) {}

    /**
     * Thêm sự kiện vào danh sách theo dõi
     * @param userId - ID người dùng
     * @param createTrackedEventDto - DTO chứa thông tin sự kiện
     * @returns Thông tin xác nhận theo dõi
     */
    async create(userId: string, createTrackedEventDto: CreateTrackedEventDto): Promise<IResponse<EventTrackedResponseDto | null>> {
        try {
            const { eventId } = createTrackedEventDto;
       
            // Kiểm tra sự kiện đã được theo dõi chưa
            const isExist = await this.trackedEventRepository.findOne({
                where: {
                    user: { id: userId },
                    event: { id: eventId }
                }
            });
        
            if (isExist) {
                return ResponseUtil.error(
                    'Bạn đã theo dõi sự kiện này rồi',
                    HttpStatus.BAD_REQUEST
                );
            }
        
            // Tạo đối tượng theo dõi
            const newTracked = this.trackedEventRepository.create({
                user: { id: userId },
                event: { id: eventId }
            });
        
            // Lưu vào DB
            const saved = await this.trackedEventRepository.save(newTracked);
        
            // Load lại đầy đủ thông tin user và event kèm images (tránh trả về thiếu field)
            const fullData = await this.trackedEventRepository.findOne({
                where: { id: saved.id },
                relations: ['user', 'event', 'event.images']
            });
        
            if (!fullData) {
                return ResponseUtil.error(
                    'Không thể tải thông tin theo dõi sau khi lưu',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
       
            const responseDto = TrackedEventMapper.toResponseDto(fullData);
        
            return ResponseUtil.success(
                responseDto,
                'Thêm vào danh sách theo dõi thành công'
            );
        } catch (error) {
            return ResponseUtil.error(
                `Lỗi khi thêm vào danh sách theo dõi: ${
                    error instanceof Error ? error.message : 'Không xác định'
                }`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Xóa sự kiện khỏi danh sách theo dõi
     * @param userId - ID người dùng
     * @param eventId - ID của sự kiện
     * @returns Kết quả xóa
     */
    async remove(userId: string, eventId: string): Promise<IResponse<{deleted: boolean} | null>> {
        try {
            const trackedEvent = await this.trackedEventRepository.findOne({
                where: {
                    user: { id: userId },
                    event: { id: eventId }
                }
            });

            if(!trackedEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy thông tin theo dõi sự kiện',
                    HttpStatus.NOT_FOUND
                );
            }

            await this.trackedEventRepository.delete(trackedEvent.id);
            return ResponseUtil.success(
                {deleted: true},
                'Xóa khỏi danh sách theo dõi thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi xóa khỏi danh sách theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái theo dõi sự kiện
     * @param userId - ID người dùng
     * @param eventId - ID sự kiện
     * @returns Trạng thái theo dõi
     */
    async isEventTracked(userId: string, eventId: string): Promise<IResponse<{ isTracked: boolean } | null>> {
        try {
            const trackedEvent = await this.trackedEventRepository.findOne({
                where: { user: { id: userId }, event: { id: eventId } }
            });

            return ResponseUtil.success(
                { isTracked: !!trackedEvent }
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi kiểm tra trạng thái: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy số lượng người theo dõi sự kiện
     * @param eventId - ID sự kiện
     * @returns Số lượng người theo dõi
     */
    async getEventTrackedCount(eventId: string): Promise<IResponse<{ count: number } | null>> {
        try {
            const count = await this.trackedEventRepository.count({
                where: { event: { id: eventId } }
            });

            return ResponseUtil.success({ count });
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy số lượng người theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách sự kiện đang theo dõi của người dùng
     * @param userId - ID người dùng
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách sự kiện đang theo dõi
     */
    async findAllByUserIdPaginated(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ events: UserTrackedEventsResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [trackedEvents, total] = await this.trackedEventRepository.findAndCount({
                where: { user: { id: userId } },
                relations: ['event', 'event.images', 'user'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDto = TrackedEventMapper.toUserEventsDto(trackedEvents);
            if (!responseDto) {
                return ResponseUtil.success({
                    events: [],
                    total: 0,
                    page,
                    limit
                });
            }

            return ResponseUtil.success({
                events: [responseDto],
                total,
                page,
                limit
            });
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy danh sách sự kiện: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách người theo dõi của một sự kiện
     * @param eventId - ID sự kiện
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách người theo dõi
     */
    async getEventTracked(
        eventId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: EventTrackedResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [tracked, total] = await this.trackedEventRepository.findAndCount({
                where: { event: { id: eventId } },
                relations: ['user', 'event', 'event.images'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDto = TrackedEventMapper.toEventTrackedDto(tracked);
            if (!responseDto) {
                return ResponseUtil.success({
                    data: [],
                    total: 0,
                    page,
                    limit
                });
            }

            return ResponseUtil.success({
                data: [responseDto],
                total,
                page,
                limit
            });
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy danh sách người theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }
}

