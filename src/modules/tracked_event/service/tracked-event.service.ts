import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { TrackedEvent } from '../entities/tracked-event.entity';
import { CreateTrackedEventDto } from '../dto/tracked-event.dto';
import { TrackedEventResponseDto } from '../dto/tracked-event-response.dto';
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
     * Tạo mới một sự kiện theo dõi
     * @param userId - ID của người dùng từ token
     * @param createTrackedEventDto - DTO chứa thông tin tạo sự kiện theo dõi
     * @returns Response chuẩn chứa thông tin sự kiện theo dõi đã tạo
     */
    async create(userId: string, createTrackedEventDto: CreateTrackedEventDto): Promise<IResponse<TrackedEventResponseDto | null>> {
        try {
            // Kiểm tra xem đã theo dõi chưa
            const existingTrack = await this.trackedEventRepository.findOne({
                where: { userId, eventId: createTrackedEventDto.eventId }
            });

            if (existingTrack) {
                return ResponseUtil.error('Bạn đã theo dõi sự kiện này rồi', HttpStatus.BAD_REQUEST);
            }

            const trackedEvent = this.trackedEventRepository.create({
                ...createTrackedEventDto,
                userId
            });
            const savedTrackedEvent = await this.trackedEventRepository.save(trackedEvent);
            return ResponseUtil.success(TrackedEventMapper.toResponseDto(savedTrackedEvent));
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi tạo sự kiện theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }
    
    /**
     * Xóa một sự kiện theo dõi
     * @param userId - ID của người dùng từ token
     * @param eventId - ID của sự kiện cần bỏ theo dõi
     * @returns Response chuẩn chứa kết quả xóa
     */
    async remove(userId: string, eventId: string): Promise<IResponse<{deleted: boolean} | null>> {
        try {
            const trackedEvent = await this.trackedEventRepository.findOne({
                where: { userId, eventId }
            });

            if (!trackedEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện theo dõi',
                    HttpStatus.NOT_FOUND
                );
            }

            await this.trackedEventRepository.remove(trackedEvent);
            return ResponseUtil.success({ deleted: true });
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi xóa sự kiện theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Kiểm tra xem người dùng đã theo dõi sự kiện chưa
     * @param userId - ID của người dùng từ token
     * @param eventId - ID của sự kiện cần kiểm tra
     * @returns Response chuẩn chứa trạng thái theo dõi
     */
    async isEventTracked(userId: string, eventId: string): Promise<IResponse<{ isTracked: boolean } | null>> {
        try {
            const trackedEvent = await this.trackedEventRepository.findOne({
                where: { userId, eventId }
            });

            return ResponseUtil.success(
                { isTracked: !!trackedEvent },
                'Kiểm tra trạng thái theo dõi thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi kiểm tra trạng thái theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy số lượng người theo dõi một sự kiện
     * @param eventId - ID của sự kiện cần lấy số lượng người theo dõi
     * @returns Response chuẩn chứa số lượng người theo dõi
     */
    async getEventTrackersCount(eventId: string): Promise<IResponse<{ count: number } | null>> {
        try {
            const count = await this.trackedEventRepository.count({
                where: { eventId }
            });

            return ResponseUtil.success(
                { count },
                'Lấy số lượng người theo dõi thành công'
            );
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
     * Lấy danh sách sự kiện theo dõi của một người dùng với phân trang
     * @param userId - ID của người dùng từ token
     * @param page - Số trang cần lấy (mặc định: 1)
     * @param limit - Số lượng item trên mỗi trang (mặc định: 10)
     * @returns Response chuẩn chứa danh sách sự kiện theo dõi đã phân trang
     */
    async findAllByUserIdPaginated(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: TrackedEventResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [trackedEvents, total] = await this.trackedEventRepository.findAndCount({
                where: { userId },
                relations: ['event', 'event.images'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDtos = trackedEvents
                .map(TrackedEventMapper.toResponseDto)
                .filter((dto): dto is TrackedEventResponseDto => dto !== null);

            return ResponseUtil.success(
                {
                    data: responseDtos,
                    total,
                    page,
                    limit
                },
                'Lấy danh sách sự kiện theo dõi thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy danh sách sự kiện theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }
}

