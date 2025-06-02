import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';

import { Event } from '../entities/event.entity';
import { ImageEvent } from '../entities/image-event.entity';
import { EventHashtag } from '../entities/event-hashtag.entity';
import { Hashtag } from '../entities/hashtag.entity';
import { S3Service } from 'src/common/aws/s3.service';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';
import { IEvent } from '../interfaces/event.interface';
import { EventResponseDto } from '../dto/response/event-response.dto';
import { EventMapper } from '../mappers/event.mapper';
import { HashtagService } from './hashtag.service';
import { UserService } from 'src/modules/user/service/user.service';
import { SearchEventByLocationDto } from '../dto/search-event.dto';

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
        private readonly userService: UserService,
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
     * @returns Response chuẩn chứa thông tin sự kiện và thông tin người tạo
     */
    async findOne(id: string): Promise<IResponse<EventResponseDto & {
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        }
    } | null>> {
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

            // Lấy thông tin user
            const userResponse = await this.userService.findOne(event.createdBy);
            const user = userResponse?.data;

            const eventDto = EventMapper.toResponseDto(event);
            if (!eventDto) {
                return ResponseUtil.error(
                    'Không thể chuyển đổi dữ liệu sự kiện',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return ResponseUtil.success({
                ...eventDto,
                createdBy: userResponse?.status ? {
                    id: user?.id || event.createdBy,
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    avatar: typeof user?.avatar === 'string' ? user.avatar : ''
                } : {
                    id: event.createdBy,
                    firstName: '',
                    lastName: '',
                    avatar: ''
                }
            }, 'Lấy thông tin sự kiện thành công');
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
                relations: ['images', 'eventHashtags', 'eventHashtags.hashtag']
            });

            if (!event) {
                return ResponseUtil.error(
                    'Không tìm thấy sự kiện để cập nhật',
                    HttpStatus.NOT_FOUND
                );
            }

            const { images, hashtags, ...updateData } = updateEventDto;
            if (hashtags && hashtags.length > 0) {
                // Xóa các liên kết cũ trước khi gọi handleHashtags
                if (event.eventHashtags && event.eventHashtags.length > 0) {
                    await this.eventHashtagRepository.remove(event.eventHashtags);
                    event.eventHashtags = []; // Clear bộ nhớ để tránh conflict
                }
            
                // Gọi lại handle như khi tạo mới
                await this.handleHashtags(event, hashtags);

                // Refetch để lấy lại eventHashtags mới
                event.eventHashtags = await this.eventHashtagRepository.find({
                    where: { event: { id: event.id } },
                    relations: ['hashtag']
                });
            }
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
                    event.images = imageEntities;
                    await this.imageRepository.save(imageEntities);
                }
            }

            await this.eventRepository.save(event);

            const updatedEvent = await this.eventRepository.findOne({
                where: { id },
                relations: ['images', 'eventHashtags', 'eventHashtags.hashtag']
            });
            console.log("Event sau update:", updatedEvent);
            console.log("Hashtags sau update:", updatedEvent?.eventHashtags.map(eh => eh.hashtag));

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

    /**
     * Lấy danh sách sự kiện trong tháng hiện tại
     * @param page Số trang (mặc định: 1)
     * @param limit Số lượng sự kiện mỗi trang (mặc định: 10)
     * @returns Danh sách sự kiện trong tháng hiện tại
     */
    async getEventsInCurrentMonth(
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
            // Lấy ngày đầu tiên và cuối cùng của tháng hiện tại
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Tạo query builder
            const queryBuilder = this.eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.images', 'images', 'images.isMain = :isMain', { isMain: true })
                .where('event.startTime >= :firstDay', { firstDay: firstDayOfMonth })
                .andWhere('event.startTime <= :lastDay', { lastDay: lastDayOfMonth })
                .orderBy('event.startTime', 'ASC');

            // Lấy tổng số items
            const totalItems = await queryBuilder.getCount();

            // Tính toán offset
            const skip = (page - 1) * limit;

            // Lấy danh sách sự kiện với phân trang
            const events = await queryBuilder
                .skip(skip)
                .take(limit)
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
            }, 'Lấy danh sách sự kiện trong tháng thành công');
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.success({
                    items: [],
                    meta: {
                        totalItems: 0,
                        itemCount: 0,
                        itemsPerPage: limit,
                        totalPages: 0,
                        currentPage: page,
                    },
                }, `Lỗi khi lấy danh sách sự kiện trong tháng: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách sự kiện từ hiện tại đến tương lai
     * @param page Số trang (mặc định: 1)
     * @param limit Số lượng sự kiện mỗi trang (mặc định: 10)
     * @returns Danh sách sự kiện sắp tới
     */
    async getUpcomingEvents(
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
            // Lấy thời gian hiện tại
            const now = new Date();

            // Tạo query builder
            const queryBuilder = this.eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.images', 'images', 'images.isMain = :isMain', { isMain: true })
                .where('event.startTime >= :now', { now })
                .orderBy('event.startTime', 'ASC');

            // Lấy tổng số items
            const totalItems = await queryBuilder.getCount();

            // Tính toán offset
            const skip = (page - 1) * limit;

            // Lấy danh sách sự kiện với phân trang
            const events = await queryBuilder
                .skip(skip)
                .take(limit)
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
            }, 'Lấy danh sách sự kiện sắp tới thành công');
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.success({
                    items: [],
                    meta: {
                        totalItems: 0,
                        itemCount: 0,
                        itemsPerPage: limit,
                        totalPages: 0,
                        currentPage: page,
                    },
                }, `Lỗi khi lấy danh sách sự kiện sắp tới: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Tìm kiếm sự kiện theo vị trí với xử lý thông minh
     * @param searchDto - DTO chứa thông tin địa điểm và bán kính tìm kiếm
     * @returns Danh sách sự kiện trong khu vực
     */
    async searchByLocation(searchDto: SearchEventByLocationDto): Promise<IResponse<{
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
            const { location, radius = 10, page = 1, limit = 10 } = searchDto;
            const skip = (page - 1) * limit;

            // Chuẩn hóa location để tìm kiếm
            const normalizedLocation = this.normalizeLocation(location);

            // Tạo query builder với các relations cần thiết
            const queryBuilder = this.eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.images', 'images', 'images.isMain = :isMain', { isMain: true });

            // Thêm điều kiện tìm kiếm theo địa điểm với nhiều pattern
            queryBuilder.where(
                `(
                    LOWER(event.position) LIKE LOWER(:exactLocation) OR
                    LOWER(event.position) LIKE LOWER(:withQuan) OR
                    LOWER(event.position) LIKE LOWER(:withQ) OR
                    LOWER(event.position) LIKE LOWER(:withDistrict) OR
                    LOWER(event.position) LIKE LOWER(:withCity)
                )`,
                {
                    exactLocation: `%${normalizedLocation}%`,
                    withQuan: `%quan ${normalizedLocation}%`,
                    withQ: `%q. ${normalizedLocation}%`,
                    withDistrict: `%district ${normalizedLocation}%`,
                    withCity: `%${this.getCityFromLocation(normalizedLocation)}%`
                }
            );

            // Lấy tổng số items
            const totalItems = await queryBuilder.getCount();

            // Nếu không tìm thấy kết quả ở cấp quận/huyện, tìm ở cấp thành phố/tỉnh
            if (totalItems === 0) {
                const cityLocation = this.getCityFromLocation(normalizedLocation);
                if (cityLocation) {
                    queryBuilder.where('LOWER(event.position) LIKE LOWER(:cityLocation)', {
                        cityLocation: `%${cityLocation}%`
                    });
                }
            }

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
            }, 'Tìm kiếm sự kiện theo vị trí thành công');
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.success({
                    items: [],
                    meta: {
                        totalItems: 0,
                        itemCount: 0,
                        itemsPerPage: searchDto.limit || 10,
                        totalPages: 0,
                        currentPage: searchDto.page || 1,
                    },
                }, `Lỗi khi tìm kiếm sự kiện theo vị trí: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Chuẩn hóa tên địa điểm để tìm kiếm
     * @param location Tên địa điểm cần chuẩn hóa
     * @returns Tên địa điểm đã chuẩn hóa
     */
    private normalizeLocation(location: string): string {
        // Loại bỏ các ký tự đặc biệt và khoảng trắng thừa
        let normalized = location.trim().toLowerCase();
        
        // Xử lý các trường hợp đặc biệt
        normalized = normalized
            .replace(/quận\s*/i, '')
            .replace(/q\.\s*/i, '')
            .replace(/q\s*/i, '')
            .replace(/huyện\s*/i, '')
            .replace(/district\s*/i, '')
            .replace(/phường\s*/i, '')
            .replace(/ward\s*/i, '')
            .replace(/xã\s*/i, '')
            .replace(/commune\s*/i, '')
            .replace(/\s+/g, ' ');

        return normalized;
    }

    /**
     * Lấy tên thành phố/tỉnh từ địa điểm
     * @param location Tên địa điểm
     * @returns Tên thành phố/tỉnh
     */
    private getCityFromLocation(location: string): string {
        // Map các quận/huyện với thành phố/tỉnh tương ứng
        const locationMap: { [key: string]: string } = {
            '1': 'Hồ Chí Minh',
            '2': 'Hồ Chí Minh',
            '3': 'Hồ Chí Minh',
            '4': 'Hồ Chí Minh',
            '5': 'Hồ Chí Minh',
            '6': 'Hồ Chí Minh',
            '7': 'Hồ Chí Minh',
            '8': 'Hồ Chí Minh',
            '9': 'Hồ Chí Minh',
            '10': 'Hồ Chí Minh',
            '11': 'Hồ Chí Minh',
            '12': 'Hồ Chí Minh',
            'thu duc': 'Hồ Chí Minh',
            'binh thanh': 'Hồ Chí Minh',
            'phu nhuan': 'Hồ Chí Minh',
            'go vap': 'Hồ Chí Minh',
            'tan binh': 'Hồ Chí Minh',
            'tan phu': 'Hồ Chí Minh',
            'binh tan': 'Hồ Chí Minh',
            'hoc mon': 'Hồ Chí Minh',
            'cu chi': 'Hồ Chí Minh',
            'nha be': 'Hồ Chí Minh',
            'can gio': 'Hồ Chí Minh',
            'binh chanh': 'Hồ Chí Minh',
            // Thêm các mapping khác cho các tỉnh/thành phố khác
        };

        // Tìm thành phố/tỉnh tương ứng
        for (const [key, value] of Object.entries(locationMap)) {
            if (location.includes(key)) {
                return value;
            }
        }

        return '';
    }
}


