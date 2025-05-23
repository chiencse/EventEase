import { Injectable, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { FavouriteEvent } from '../entities/favourite-event.entity';
import { CreateFavouriteEventDto } from '../dto/favourite-event.dto';
import { FavouriteEventResponseDto } from '../dto/favourite-event-response.dto';
import { FavouriteEventMapper } from '../mappers/favourite-event.mapper';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';
import { getUserId } from 'src/common/utils/user.util';
@Injectable()
export class FavouriteEventService {
    constructor(
        @InjectRepository(FavouriteEvent)
        private readonly favouriteEventRepository: Repository<FavouriteEvent>,
    ) {}

    /**
     * Tạo mới một sự kiện yêu thích
     * @param createFavouriteEventDto - DTO chứa thông tin tạo sự kiện yêu thích
     * @returns Response chuẩn chứa thông tin sự kiện yêu thích đã tạo
     */
    async create(userId: string, createFavouriteEventDto: CreateFavouriteEventDto): Promise<IResponse<FavouriteEventResponseDto | null>> {
        try {
            const favouriteEvent = this.favouriteEventRepository.create({
                userId,
                ...createFavouriteEventDto
            });
            const savedFavouriteEvent = await this.favouriteEventRepository.save(favouriteEvent);
            return ResponseUtil.success(FavouriteEventMapper.toResponseDto(savedFavouriteEvent));
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(  
                    `Lỗi khi tạo sự kiện yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Xóa một sự kiện yêu thích
     * @param id - ID của sự kiện yêu thích cần xóa
     * @returns Response chuẩn chứa kết quả xóa
     */
    async remove(id: number): Promise<IResponse<{deleted: boolean} | null>> {
        try {
            const favouriteEvent = await this.favouriteEventRepository.findOne({
                where: {id}
            });

            if(!favouriteEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện yêu thích',
                    HttpStatus.NOT_FOUND
                );
            }

            await this.favouriteEventRepository.delete(id);
            return ResponseUtil.success({deleted: true});
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi xóa sự kiện yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Kiểm tra xem người dùng đã yêu thích sự kiện chưa
     * @param userId - ID của người dùng cần kiểm tra
     * @param eventId - ID của sự kiện cần kiểm tra
     * @returns Response chuẩn chứa trạng thái yêu thích
     */
    async isEventFavourited(userId: string, eventId: string): Promise<IResponse<{ isFavourited: boolean } | null>> {
        try {
            const favouriteEvent = await this.favouriteEventRepository.findOne({
                where: { userId, eventId }
            });

            return ResponseUtil.success(
                { isFavourited: !!favouriteEvent },
                'Kiểm tra trạng thái yêu thích thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi kiểm tra trạng thái yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy số lượng người yêu thích một sự kiện
     * @param eventId - ID của sự kiện cần lấy số lượng người yêu thích
     * @returns Response chuẩn chứa số lượng người yêu thích
     */
    async getEventFavouritesCount(eventId: string): Promise<IResponse<{ count: number } | null>> {
        try {
            const count = await this.favouriteEventRepository.count({
                where: { eventId }
            });

            return ResponseUtil.success(
                { count },
                'Lấy số lượng người yêu thích thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy số lượng người yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách sự kiện yêu thích của một người dùng với phân trang
     * @param userId - ID của người dùng cần lấy danh sách
     * @param page - Số trang cần lấy (mặc định: 1)
     * @param limit - Số lượng item trên mỗi trang (mặc định: 10)
     * @returns Response chuẩn chứa danh sách sự kiện yêu thích đã phân trang
     */
    async findAllByUserIdPaginated(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: FavouriteEventResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [favouriteEvents, total] = await this.favouriteEventRepository.findAndCount({
                where: { userId },
                relations: ['event', 'event.images'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDtos = favouriteEvents
                .map(FavouriteEventMapper.toResponseDto)
                .filter((dto): dto is FavouriteEventResponseDto => dto !== null);

            return ResponseUtil.success(
                {
                    data: responseDtos,
                    total,
                    page,
                    limit
                },
                'Lấy danh sách sự kiện yêu thích thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy danh sách sự kiện yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }
} 