import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event } from '../entities/event.entity';
import { ImageEvent } from '../entities/image-event.entity';
import { EventHashtag } from '../entities/event-hashtag.entity';
import { Hashtag } from '../entities/hashtag.entity';
import { S3Service } from 'src/common/s3/s3.service';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';
import { IEvent } from '../interfaces/event.interface';
import { EventResponseDto } from '../dto/response/event-response.dto';
import { EventMapper } from '../mappers/event.mapper';
import { HashtagService } from './hashtag.service';

@Injectable()
export class EventService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,

        @InjectRepository(ImageEvent)
        private readonly imageRepository: Repository<ImageEvent>,

        @InjectRepository(EventHashtag)
        private readonly eventHashtagRepository: Repository<EventHashtag>,

        @InjectRepository(Hashtag)
        private readonly hashtagRepository: Repository<Hashtag>,

        private readonly s3Service: S3Service,
        private readonly hashtagService: HashtagService,
    ) {}
    
    /**
     * Xử lý hashtags cho event
     * - Nếu hashtag đã tồn tại: lấy ID và tạo liên kết
     * - Nếu hashtag chưa tồn tại: tạo mới, lấy ID và tạo liên kết
     */
    private async handleHashtags(event: Event, hashtagNames: string[]): Promise<void> {
        // Xóa các event-hashtag cũ nếu có
        if (event.eventHashtags) {
            await this.eventHashtagRepository.remove(event.eventHashtags);
        }

        // Xử lý từng hashtag
        for (const hashtagName of hashtagNames) {
            // Chuẩn hóa tên hashtag
            const normalizedName = hashtagName.trim().toLowerCase();
            
            // Tìm hashtag đã tồn tại
            let hashtag = await this.hashtagRepository.findOne({
                where: { name: normalizedName }
            });

            // Nếu chưa tồn tại thì tạo mới
            if (!hashtag) {
                hashtag = this.hashtagRepository.create({
                    name: normalizedName,
                    usageCount: 1
                });
                await this.hashtagRepository.save(hashtag);
            } else {
                // Nếu đã tồn tại thì tăng số lần sử dụng
                await this.hashtagService.incrementUsageCount(hashtag.id);
            }

            // Tạo liên kết event-hashtag
            const eventHashtag = this.eventHashtagRepository.create({
                event,
                hashtag
            });
            await this.eventHashtagRepository.save(eventHashtag);
        }
    }
    
    /**
     * Tạo mới một sự kiện kèm danh sách ảnh và hashtags
     * - Lưu dữ liệu sự kiện vào bảng `events`
     * - Upload ảnh lên S3
     * - Lưu thông tin ảnh vào bảng `image_event` (ảnh đầu tiên sẽ được đặt làm ảnh chính)
     * - Trả về dữ liệu sự kiện đã lưu, bao gồm cả ảnh
     * 
     * @param createEventDto - DTO chứa thông tin sự kiện và mảng ảnh (nếu có)
     * @returns Response chuẩn chứa thông tin sự kiện đã tạo
     */
    async create(createEventDto: CreateEventDto): Promise<IResponse<EventResponseDto | null>> {
        try {
            const { images, hashtags, ...eventData } = createEventDto;
          
            const newEvent = this.eventRepository.create(eventData);
            const savedEvent = await this.eventRepository.save(newEvent);

            // Xử lý hashtags
            if (hashtags && hashtags.length > 0) {
                await this.handleHashtags(savedEvent, hashtags);
            }
          
            if (images && images.length > 0) {
                const urls = await this.s3Service.uploadBatch(images, 'events');
                
                const imageEntities = images.map((file, index) => 
                    this.imageRepository.create({
                        imageUrl: urls[index],
                        fileName: file.originalname,
                        fileType: file.mimetype,
                        fileSize: file.size.toString(),
                        event: savedEvent,
                        isMain: index === 0 // Ảnh đầu tiên luôn là ảnh chính
                    })
                );
                
                await this.imageRepository.save(imageEntities);
            }
          
            const event = await this.eventRepository.findOne({
                where: { id: savedEvent.id },
                relations: ['images', 'eventHashtags', 'eventHashtags.hashtag'],
            });

            if (!event) {
                throw new NotFoundException('Không tìm thấy sự kiện sau khi tạo');
            }

            const eventDto = EventMapper.toResponseDto(event);
            return ResponseUtil.success(eventDto, 'Tạo sự kiện thành công', 201);
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi tạo sự kiện: ${error.message}`,
                    error instanceof NotFoundException ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }
    
    /**
     * Lấy danh sách tất cả sự kiện
     * @returns Response chuẩn chứa danh sách sự kiện
     */
    async findAll(): Promise<IResponse<EventResponseDto[] | null>> {
        try {
            const events = await this.eventRepository.find({
                relations: ['images', 'eventHashtags', 'eventHashtags.hashtag']
            });
            
            const eventDtos = events
                .map(event => EventMapper.toResponseDto(event))
                .filter((dto): dto is EventResponseDto => dto !== null);
            
            return ResponseUtil.success(eventDtos, 'Lấy danh sách sự kiện thành công');
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
     * Lấy thông tin chi tiết một sự kiện theo ID
     * @param id - ID của sự kiện cần lấy
     * @returns Response chuẩn chứa thông tin sự kiện
     */
    async findOne(id: string): Promise<IResponse<EventResponseDto | null>> {
        try {
            const event = await this.eventRepository.findOne({
                where: { id },
                relations: ['images', 'eventHashtags', 'eventHashtags.hashtag']
            });

            if (!event) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện',
                    HttpStatus.NOT_FOUND
                );
            }

            const eventDto = EventMapper.toResponseDto(event);
            return ResponseUtil.success(eventDto, 'Lấy thông tin sự kiện thành công');
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy thông tin sự kiện: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }
    
    /**
     * Cập nhật thông tin sự kiện theo ID
     * - Cập nhật thông tin cơ bản của sự kiện
     * - Nếu có ảnh mới:
     *   + Xóa các ảnh cũ trên S3 và trong database
     *   + Upload các ảnh mới lên S3
     *   + Lưu thông tin ảnh mới vào database (ảnh đầu tiên sẽ được đặt làm ảnh chính)
     * 
     * @param id - ID của sự kiện cần cập nhật
     * @param updateEventDto - Dữ liệu cập nhật sự kiện
     * @returns Response chuẩn chứa thông tin sự kiện sau khi cập nhật
     */
    async update(id: string, updateEventDto: IEvent): Promise<IResponse<EventResponseDto | null>> {
        try {
            const event = await this.eventRepository.findOne({
                where: { id },
                relations: ['images']
            });

            if (!event) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện để cập nhật',
                    HttpStatus.NOT_FOUND
                );
            }

            const { images, ...updateData } = updateEventDto;

            Object.assign(event, updateData);

            if (images) {
                if (event.images && event.images.length > 0) {
                    const oldUrls = event.images.map(img => img.imageUrl);
                    await this.s3Service.deleteBatch(oldUrls);
                    await this.imageRepository.remove(event.images);
                }

                if (images.length > 0) {
                    const urls = await this.s3Service.uploadBatch(images, 'events');
                    
                    const imageEntities = images.map((file, index) => 
                        this.imageRepository.create({
                            imageUrl: urls[index],
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            fileSize: file.size.toString(),
                            event: event,
                            isMain: index === 0
                        })
                    );
                    
                    await this.imageRepository.save(imageEntities);
                }
            }

            await this.eventRepository.save(event);

            const updatedEvent = await this.eventRepository.findOne({
                where: { id },
                relations: ['images']
            });

            if (!updatedEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện sau khi cập nhật',
                    HttpStatus.NOT_FOUND
                );
            }

            const eventDto = EventMapper.toResponseDto(updatedEvent);
            return ResponseUtil.success(eventDto, 'Cập nhật sự kiện thành công');
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi cập nhật sự kiện: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Xóa sự kiện theo ID
     * @param id - ID của sự kiện cần xóa
     * @returns Response chuẩn thông báo kết quả xóa
     */
    async remove(id: string): Promise<IResponse<{deleted: boolean} | null>> {
        try {
            // Kiểm tra sự kiện tồn tại
            const event = await this.eventRepository.findOne({
                where: { id },
                relations: ['images']
            });

            if (!event) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện để xóa',
                    HttpStatus.NOT_FOUND
                );
            }

            // Xóa ảnh trên S3 nếu có
            if (event.images && event.images.length > 0) {
                const urls = event.images.map(img => img.imageUrl);
                await this.s3Service.deleteBatch(urls);
            }

            // Xóa sự kiện
            await this.eventRepository.delete(id);

            return ResponseUtil.success(
                { deleted: true },
                'Xóa sự kiện thành công'
            );
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi xóa sự kiện: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Đặt ảnh chính cho sự kiện
     * - Kiểm tra sự kiện và ảnh tồn tại
     * - Reset tất cả ảnh về trạng thái không phải ảnh chính
     * - Đặt ảnh được chọn làm ảnh chính
     * 
     * @param eventId - ID của sự kiện
     * @param imageId - ID của ảnh cần đặt làm ảnh chính
     * @returns Response chuẩn chứa thông tin sự kiện sau khi cập nhật
     */
    async setMainImage(eventId: string, imageId: number): Promise<IResponse<EventResponseDto | null>> {
        try {
            const event = await this.eventRepository.findOne({
                where: { id: eventId },
                relations: ['images']
            });

            if (!event) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện',
                    HttpStatus.NOT_FOUND
                );
            }

            const image = event.images.find(img => img.id === imageId);
            if (!image) {
                return ResponseUtil.error(
                    'Không tìm thấy ảnh trong sự kiện',
                    HttpStatus.NOT_FOUND
                );
            }

            // Reset tất cả ảnh về false
            await this.imageRepository.update(
                { event: { id: eventId } },
                { isMain: false }
            );

            // Set ảnh được chọn làm ảnh chính
            image.isMain = true;
            await this.imageRepository.save(image);

            // Lấy lại thông tin event sau khi cập nhật
            const updatedEvent = await this.eventRepository.findOne({
                where: { id: eventId },
                relations: ['images']
            });

            if (!updatedEvent) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện sau khi cập nhật',
                    HttpStatus.NOT_FOUND
                );
            }

            const eventDto = EventMapper.toResponseDto(updatedEvent);
            return ResponseUtil.success(eventDto, 'Cập nhật ảnh chính thành công');
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi cập nhật ảnh chính: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách sự kiện có phân trang
     * @param page Số trang (mặc định: 1)
     * @param limit Số lượng sự kiện mỗi trang (mặc định: 10)
     * @param search Từ khóa tìm kiếm (tìm theo tên sự kiện)
     * @returns Danh sách sự kiện và thông tin phân trang
     */
    async findAllWithPagination(
        page: number = 1,
        limit: number = 10,
        search?: string
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
        try {
            console.log("Incoming limit:", limit);
            // Tạo query builder
            const queryBuilder = this.eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.images', 'images')
                .leftJoinAndSelect('event.eventHashtags', 'eventHashtags')
                .leftJoinAndSelect('eventHashtags.hashtag', 'hashtag');

            // Thêm điều kiện tìm kiếm nếu có
            if (search) {
                queryBuilder.where(
                    '(event.title ILIKE :search OR event.description ILIKE :search OR event.position ILIKE :search OR hashtag.name ILIKE :search)',
                    { search: `%${search}%` }
                );
            }

            // Lấy tổng số items trước
            const totalItems = await queryBuilder.getCount();

            // Tính toán offset
            const skip = (page - 1) * limit;

            // Lấy danh sách sự kiện với phân trang
            const events = await queryBuilder
                .skip(skip)
                .take(limit)
                .orderBy('event.createdAt', 'DESC')
                .getMany();

            // Chuyển đổi sang DTO
            const eventDtos = events
                .map(event => EventMapper.toResponseDto(event))
                .filter((dto): dto is EventResponseDto => dto !== null);

            // Tính toán thông tin phân trang
            const totalPages = Math.ceil(totalItems / limit);
            const itemCount = eventDtos.length;

            return ResponseUtil.success({
                items: eventDtos,
                meta: {
                    totalItems,
                    itemCount,
                    itemsPerPage: limit,
                    totalPages,
                    currentPage: page,
                },
            }, 'Lấy danh sách sự kiện thành công');
        } catch (error) {
            if (error instanceof Error) {
                return {
                    data: {
                        items: [],
                        meta: {
                            totalItems: 0,
                            itemCount: 0,
                            itemsPerPage: limit,
                            totalPages: 0,
                            currentPage: page
                        }
                    },
                    message: `Lỗi khi lấy danh sách sự kiện: ${error.message}`,
                    status: false,
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    timestamp: new Date().toISOString()
                };
            }
            throw error;
        }
    }

    async findMyEvents(
        userId: string,
        page: number = 1,
        limit: number = 10
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
        try {
            const queryBuilder = this.eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.images', 'image', 'image.isMain = :isMain', { isMain: true })
                .leftJoinAndSelect('event.eventHashtags', 'eventHashtag')
                .leftJoinAndSelect('eventHashtag.hashtag', 'hashtag')
                .where('event.createdBy = :userId', { userId })
                .orderBy('event.startTime', 'ASC');

            const totalItems = await queryBuilder.getCount();
            const skip = (page - 1) * limit;

            const events = await queryBuilder
                .skip(skip)
                .take(limit)
                .getMany();

            const eventDtos = events
                .map(event => EventMapper.toResponseDto(event))
                .filter((dto): dto is EventResponseDto => dto !== null);

            const totalPages = Math.ceil(totalItems / limit);
            const itemCount = eventDtos.length;

            return ResponseUtil.success({
                items: eventDtos,
                meta: {
                    totalItems,
                    itemCount,
                    itemsPerPage: limit,
                    totalPages,
                    currentPage: page,
                },
            }, 'Lấy danh sách sự kiện thành công');
        } catch (error) {
            if (error instanceof Error) {
                return {
                    data: {
                        items: [],
                        meta: {
                            totalItems: 0,
                            itemCount: 0,
                            itemsPerPage: limit,
                            totalPages: 0,
                            currentPage: page
                        }
                    },
                    message: `Lỗi khi lấy danh sách sự kiện: ${error.message}`,
                    status: false,
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    timestamp: new Date().toISOString()
                };
            }
            throw error;
        }
    }
}


