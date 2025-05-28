import { Injectable, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { FavouriteEvent } from '../entities/favourite-event.entity';
import { CreateFavouriteEventDto } from '../dto/favourite-event.dto';
import { EventFavouriteResponseDto, UserFavouriteEventsResponseDto } from '../dto/favourite-event-response.dto';
import { FavouriteEventMapper } from '../mappers/favourite-event.mapper';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';

@Injectable()
export class FavouriteEventService {
    constructor(
        @InjectRepository(FavouriteEvent)
        private readonly favouriteEventRepository: Repository<FavouriteEvent>,
    ) {}

    /**
     * Thêm sự kiện vào danh sách yêu thích
     * @param userId - ID người dùng
     * @param createFavouriteEventDto - DTO chứa thông tin sự kiện
     * @returns Thông tin xác nhận yêu thích
     */
    async create( userId: string, createFavouriteEventDto: CreateFavouriteEventDto ): Promise<IResponse<EventFavouriteResponseDto | null>> {
        try {
          const { eventId } = createFavouriteEventDto;
      
          // Kiểm tra sự kiện đã được yêu thích chưa
          const isExist = await this.favouriteEventRepository.findOne({
            where: {
              user: { id: userId },
              event: { id: eventId }
            }
          });
      
          if (isExist) {
            return ResponseUtil.error(
              'Bạn đã thêm sự kiện này vào danh sách yêu thích',
              HttpStatus.BAD_REQUEST
            );
          }
      
          // Tạo đối tượng yêu thích
          const newFavourite = this.favouriteEventRepository.create({
            user: { id: userId },
            event: { id: eventId }
          });
      
          // Lưu vào DB
          const saved = await this.favouriteEventRepository.save(newFavourite);
      
          // Load lại đầy đủ thông tin user và event kèm images (tránh trả về thiếu field)
          const fullData = await this.favouriteEventRepository.findOne({
            where: { id: saved.id },
            relations: ['user', 'event', 'event.images']
          });
      
          if (!fullData) {
            return ResponseUtil.error(
              'Không thể tải thông tin yêu thích sau khi lưu',
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          }
      
          const responseDto = FavouriteEventMapper.toResponseDto(fullData);
      
          return ResponseUtil.success(
            responseDto,
            'Thêm vào danh sách yêu thích thành công'
          );
        } catch (error) {
          return ResponseUtil.error(
            `Lỗi khi thêm vào danh sách yêu thích: ${
              error instanceof Error ? error.message : 'Không xác định'
            }`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }
      

    /**
     * Xóa sự kiện khỏi danh sách yêu thích
     * @param userId - ID người dùng
     * @param eventId - ID của sự kiện
     * @returns Kết quả xóa
     */
    async remove(userId: string, eventId: string): Promise<IResponse<{deleted: boolean} | null>> {
        try {
            const favouriteEvent = await this.favouriteEventRepository.findOne({
                where: {
                    user: { id: userId },
                    event: { id: eventId }
                }
            });

            if(!favouriteEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy thông tin yêu thích sự kiện',
                    HttpStatus.NOT_FOUND
                );
            }

            await this.favouriteEventRepository.delete(favouriteEvent.id);
            return ResponseUtil.success(
                {deleted: true},
                'Xóa khỏi danh sách yêu thích thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi xóa khỏi danh sách yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái yêu thích sự kiện
     * @param userId - ID người dùng
     * @param eventId - ID sự kiện
     * @returns Trạng thái yêu thích
     */
    async isEventFavourited(userId: string, eventId: string): Promise<IResponse<{ isFavourited: boolean } | null>> {
        try {
            const favouriteEvent = await this.favouriteEventRepository.findOne({
                where: { user: { id: userId }, event: { id: eventId } }
            });

            return ResponseUtil.success(
                { isFavourited: !!favouriteEvent }
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
     * Lấy số lượng người yêu thích sự kiện
     * @param eventId - ID sự kiện
     * @returns Số lượng người yêu thích
     */
    async getEventFavouritesCount(eventId: string): Promise<IResponse<{ count: number } | null>> {
        try {
            const count = await this.favouriteEventRepository.count({
                where: { event: { id: eventId } }
            });

            return ResponseUtil.success({ count });
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
     * Lấy danh sách sự kiện yêu thích của người dùng
     * @param userId - ID người dùng
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách sự kiện yêu thích
     */
    async findAllByUserIdPaginated(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ events: UserFavouriteEventsResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [favouriteEvents, total] = await this.favouriteEventRepository.findAndCount({
                where: { user: { id: userId } },
                relations: ['event', 'event.images', 'user'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDto = FavouriteEventMapper.toUserEventsDto(favouriteEvents);
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
     * Lấy danh sách người yêu thích của một sự kiện
     * @param eventId - ID sự kiện
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách người yêu thích
     */
    async getEventFavourites(
        eventId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: EventFavouriteResponseDto[], total: number, page: number, limit: number } | null>> {
        try {
            const [favourites, total] = await this.favouriteEventRepository.findAndCount({
                where: { event: { id: eventId } },
                relations: ['user', 'event', 'event.images'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDto = FavouriteEventMapper.toEventFavouritesDto(favourites);
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
                    `Lỗi khi lấy danh sách người yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách sự kiện yêu thích của người dùng (không phân trang)
     * @param userId - ID người dùng
     * @returns Danh sách sự kiện yêu thích
     */
    async findAllByUserId(
        userId: string
    ): Promise<IResponse<UserFavouriteEventsResponseDto[]>> {
        try {
            const favouriteEvents = await this.favouriteEventRepository.find({
                where: { user: { id: userId } },
                relations: ['event', 'event.images', 'user'],
                order: { createdAt: 'DESC' }
            });

            const responseDto = FavouriteEventMapper.toUserEventsDto(favouriteEvents);
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