import { Injectable, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ParticipatedEvent } from '../entities/participated-event.entity';
import { CreateParticipatedEventDto } from '../dto/participated-event.dto';
import { ParticipatedEventResponseDto } from '../dto/participated-event-response.dto';
import { ParticipatedEventMapper } from '../mappers/participated-event.mapper';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';

@Injectable()
export class ParticipatedEventService {
    constructor(
        @InjectRepository(ParticipatedEvent)
        private readonly participatedEventRepository: Repository<ParticipatedEvent>,
    ) {}

    /**
     * Tạo mới một sự kiện tham gia
     * @param createParticipatedEventDto - DTO chứa thông tin tạo sự kiện tham gia
     * @returns Response chuẩn chứa thông tin sự kiện tham gia đã tạo
     */
    async create(createParticipatedEventDto: CreateParticipatedEventDto): Promise<IResponse<ParticipatedEventResponseDto | null>> {
        try {
            const participatedEvent = this.participatedEventRepository.create(createParticipatedEventDto);
            const savedParticipatedEvent = await this.participatedEventRepository.save(participatedEvent);
            return ResponseUtil.success(ParticipatedEventMapper.toResponseDto(savedParticipatedEvent));
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi tạo sự kiện tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Xóa một sự kiện tham gia
     * @param id - ID của sự kiện tham gia cần xóa
     * @returns Response chuẩn chứa kết quả xóa
     */
    async remove(id: number): Promise<IResponse<{deleted: boolean} | null>> {
        try {
            const participatedEvent = await this.participatedEventRepository.findOne({
                where: {id}
            });

            if(!participatedEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện tham gia',
                    HttpStatus.NOT_FOUND
                );
            }

            await this.participatedEventRepository.delete(id);
            return ResponseUtil.success({deleted: true});
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi xóa sự kiện tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Kiểm tra xem người dùng đã tham gia sự kiện chưa
     * @param userId - ID của người dùng cần kiểm tra
     * @param eventId - ID của sự kiện cần kiểm tra
     * @returns Response chuẩn chứa trạng thái tham gia
     */
    async isEventParticipated(userId: number, eventId: number): Promise<IResponse<{ isParticipated: boolean } | null>> {
        try {
            const participatedEvent = await this.participatedEventRepository.findOne({
                where: { userId, eventId }
            });

            return ResponseUtil.success(
                { isParticipated: !!participatedEvent },
                'Kiểm tra trạng thái tham gia thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi kiểm tra trạng thái tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy số lượng người tham gia một sự kiện
     * @param eventId - ID của sự kiện cần lấy số lượng người tham gia
     * @returns Response chuẩn chứa số lượng người tham gia
     */
    async getEventParticipantsCount(eventId: number): Promise<IResponse<{ count: number } | null>> {
        try {
            const count = await this.participatedEventRepository.count({
                where: { eventId }
            });

            return ResponseUtil.success(
                { count },
                'Lấy số lượng người tham gia thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy số lượng người tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách sự kiện tham gia của một người dùng với phân trang
     * @param userId - ID của người dùng cần lấy danh sách
     * @param page - Số trang cần lấy (mặc định: 1)
     * @param limit - Số lượng item trên mỗi trang (mặc định: 10)
     * @returns Response chuẩn chứa danh sách sự kiện tham gia đã phân trang
     */
    async findAllByUserIdPaginated(
        userId: number,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: ParticipatedEventResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [participatedEvents, total] = await this.participatedEventRepository.findAndCount({
                where: { userId },
                relations: ['event', 'event.images'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDtos = participatedEvents
                .map(ParticipatedEventMapper.toResponseDto)
                .filter((dto): dto is ParticipatedEventResponseDto => dto !== null);

            return ResponseUtil.success(
                {
                    data: responseDtos,
                    total,
                    page,
                    limit
                },
                'Lấy danh sách sự kiện tham gia thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy danh sách sự kiện tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }
} 