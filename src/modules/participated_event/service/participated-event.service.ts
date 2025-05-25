import { Injectable, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ParticipatedEvent } from '../entities/participated-event.entity';
import { CreateParticipatedEventDto } from '../dto/participated-event.dto';
import { EventParticipantResponseDto, UserParticipatedEventsResponseDto } from '../dto/event-participant-response.dto';
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
     * Đăng ký tham gia sự kiện
     * @param userId - ID người dùng
     * @param createParticipatedEventDto - DTO chứa thông tin đăng ký
     * @returns Thông tin xác nhận đăng ký
     */
    async create(userId: string, createParticipatedEventDto: CreateParticipatedEventDto): Promise<IResponse<EventParticipantResponseDto | null>> {
        try {
            const existing = await this.participatedEventRepository.findOne({
                where: { user: { id: userId }, event: { id: createParticipatedEventDto.eventId } }
            });

            if (existing) {
                return ResponseUtil.error(
                    'Bạn đã đăng ký tham gia sự kiện này',
                    HttpStatus.BAD_REQUEST
                );
            }

            const participatedEvent = this.participatedEventRepository.create({
                user: { id: userId },
                event: { id: createParticipatedEventDto.eventId }
            });

            const savedParticipatedEvent = await this.participatedEventRepository.save(participatedEvent);
            return ResponseUtil.success(
                ParticipatedEventMapper.toResponseDto(savedParticipatedEvent),
                'Đăng ký tham gia sự kiện thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi đăng ký tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Hủy tham gia sự kiện
     * @param id - ID của bản ghi tham gia
     * @returns Kết quả hủy tham gia
     */
    async remove(id: string): Promise<IResponse<{deleted: boolean} | null>> {
        try {
            const participatedEvent = await this.participatedEventRepository.findOne({
                where: {id}
            });

            if(!participatedEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy thông tin tham gia sự kiện',
                    HttpStatus.NOT_FOUND
                );
            }

            await this.participatedEventRepository.delete(id);
            return ResponseUtil.success(
                {deleted: true},
                'Hủy tham gia sự kiện thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi hủy tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái tham gia sự kiện
     * @param userId - ID người dùng
     * @param eventId - ID sự kiện
     * @returns Trạng thái tham gia
     */
    async isEventParticipated(userId: string, eventId: string): Promise<IResponse<{ isParticipated: boolean } | null>> {
        try {
            const participatedEvent = await this.participatedEventRepository.findOne({
                where: { user: { id: userId }, event: { id: eventId } }
            });

            return ResponseUtil.success(
                { isParticipated: !!participatedEvent }
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
     * Lấy số lượng người tham gia sự kiện
     * @param eventId - ID sự kiện
     * @returns Số lượng người tham gia
     */
    async getEventParticipantsCount(eventId: string): Promise<IResponse<{ count: number } | null>> {
        try {
            const count = await this.participatedEventRepository.count({
                where: { event: { id: eventId } }
            });

            return ResponseUtil.success({ count });
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
     * Lấy danh sách sự kiện đã tham gia của người dùng
     * @param userId - ID người dùng
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách sự kiện đã tham gia
     */
    async findAllByUserIdPaginated(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: UserParticipatedEventsResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [participatedEvents, total] = await this.participatedEventRepository.findAndCount({
                where: { user: { id: userId } },
                relations: ['event', 'event.images', 'user'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDto = ParticipatedEventMapper.toUserEventsDto(participatedEvents);
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
                    `Lỗi khi lấy danh sách sự kiện: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách người tham gia của một sự kiện
     * @param eventId - ID sự kiện
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách người tham gia
     */
    async getEventParticipants(
        eventId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: EventParticipantResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [participants, total] = await this.participatedEventRepository.findAndCount({
                where: { event: { id: eventId } },
                relations: ['user', 'event', 'event.images'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDto = ParticipatedEventMapper.toEventParticipantsDto(participants);
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
                    `Lỗi khi lấy danh sách người tham gia: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách sự kiện đã tham gia của người dùng (không phân trang)
     * @param userId - ID người dùng
     * @returns Danh sách sự kiện đã tham gia
     */
    async findAllByUserId(
        userId: string
    ): Promise<IResponse<UserParticipatedEventsResponseDto[]>> {
        try {
            const participatedEvents = await this.participatedEventRepository.find({
                where: { user: { id: userId } },
                relations: ['event', 'event.images', 'user'],
                order: { createdAt: 'DESC' }
            });

            const responseDto = ParticipatedEventMapper.toUserEventsDto(participatedEvents);
            if (!responseDto) {
                return ResponseUtil.success([]);
            }

            return ResponseUtil.success([responseDto]);
        } catch (error) {
            if (error instanceof Error) {
                return {
                    status: false,
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    timestamp: new Date().toISOString(),
                    message: `Lỗi khi lấy danh sách sự kiện: ${error.message}`,
                    data: []
                };
            }
            throw error;
        }
    }
} 