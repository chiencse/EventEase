import { Injectable, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Follower } from '../entities/follower.entity';
import { CreateFollowerDto } from '../dto/follower.dto';
import { FollowerResponseDto, FollowerUserDto } from '../dto/follower-response.dto';
import { FollowerMapper } from '../mappers/follower.mapper';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';

@Injectable()
export class FollowerService {
    constructor(
        @InjectRepository(Follower)
        private readonly followerRepository: Repository<Follower>,
    ) { }

    /**
     * Thêm mối quan hệ vào danh sách quản lý theo dõi
     * @param user_1 - ID người dùng
     * @param createFollowerDto - DTO chứa thông tin người được theo dõi
     * @returns Thông tin xác nhận tạo lập mối quan
     */
    async create(
        user_1: string,
        createFollowerDto: CreateFollowerDto,
    ): Promise<IResponse<FollowerResponseDto | null>> {
        try {
            const { userId } = createFollowerDto;

            // Kiểm tra mối quan hệ đã được tạo lập chưa
            const isExist = await this.followerRepository.findOne({
                where: {
                    user_1: { id: user_1 },
                    user_2: { id: userId },
                },
            });

            if (isExist) {
                return ResponseUtil.error(
                    'Bạn đã theo dõi người này rồi',
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Tạo mối quan hệ mới
            const newRelationship = this.followerRepository.create({
                user_1: { id: user_1 },
                user_2: { id: userId },
                isFollow: true,
            });

            // Lưu vào DB
            const saved = await this.followerRepository.save(newRelationship);

            // Load lại đầy đủ thông tin của người dùng và người được theo dõi
            const fullData = await this.followerRepository.findOne({
                where: { id: saved.id },
                relations: ['user_1', 'user_2'],
            });

            if (!fullData) {
                return ResponseUtil.error(
                    'Không thể tải mối quan hệ theo dõi sau khi tạo',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            const responseDto = FollowerMapper.toResponseDto(fullData);

            return ResponseUtil.success(
                responseDto,
                'Mối quan hệ đã được khởi tạo thành công',
            );
        } catch (error) {
            return ResponseUtil.error(
                `Lỗi khi tạo quan hệ mới: ${error instanceof Error ? error.message : 'Không xác định'
                }`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Kiểm tra trạng thái theo dõi của người dùng với người khác
     * @param mainUser - ID người dùng chính
     * @param userId - ID người dùng
     * @returns Trạng thái theo dõi của người dùng
     */
    async followStatus(
        mainUser: string,
        userId: string,
    ): Promise<IResponse<{ isFollow: boolean; isCreated: boolean } | null>> {
        try {
            const follow = await this.followerRepository.findOne({
                where: { user_1: { id: mainUser }, user_2: { id: userId } },
            });

            const followed = await this.followerRepository.findOne({
                where: { user_1: { id: userId }, user_2: { id: mainUser } },
            });

            if (follow) {
                return ResponseUtil.success({
                    isFollow: follow.isFollow,
                    isCreated: true,
                });
            }
            if (followed) {
                return ResponseUtil.success({
                    isFollow: followed.isFollowed,
                    isCreated: true,
                });
            }
            return ResponseUtil.success({ isFollow: false, isCreated: false });
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi kiểm tra trạng thái: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            throw error;
        }
    }

    /**
     * Lấy số lượng người theo dõi hoặc được theo dõi
     * @param userId - ID người dùng
     * @param follow - true nếu lấy người theo dõi, false nếu lấy người được theo dõi
     * @returns Số lượng người yêu thích
     */
    async getCount(
        userId: string,
        follow: boolean
    ): Promise<IResponse<{ count: number } | null>> {
        try {
            console.log('userId', userId, 'follow', follow);
            const count = await this.followerRepository.count({
                where: follow
                    ? { user_1_id: userId }
                    : { user_2_id: userId },
            });
            return ResponseUtil.success({ count });
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy số lượng người yêu thích: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            throw error;
        }
    }

    /**
     * Lấy danh sách người đang theo dõi
     * @param userId - ID người dùng
     * @param page - Số trang
     * @param limit - Số lượng item trên mỗi trang
     * @returns Danh sách người dùng đang theo dõi
     */
    async getFollowList(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<IResponse<{ data: FollowerUserDto[]; total: number; page: number; limit: number } | null>> {
        try {
            const [followRecords, total] = await this.followerRepository.findAndCount({
                where: {
                    user_1: { id: userId },
                    isFollow: true
                },
                relations: ['user_2'],
                skip: (page - 1) * limit,
                take: limit,
                order: { createdAt: 'DESC' }
            });

            const responseDto: FollowerUserDto[] = followRecords.map(follow => ({
                user: {
                    id: follow.user_2.id,
                    firstName: follow.user_2.firstName,
                    lastName: follow.user_2.lastName,
                    avatar: follow.user_2.avatar
                },
                createdAt: follow.createdAt
            }));

            return ResponseUtil.success({
                data: responseDto,
                total,
                page,
                limit
            });
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi lấy danh sách người đang theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw error;
        }
    }

    /**
     * Cập nhật mối quan hệ theo dõi
     * @param mainUser - ID người dùng chính
     * @param userId - ID người dùng được theo dõi
     * @returns Thông tin mối quan hệ theo dõi đã cập nhật
     */
    async update(
        mainUser: string,
        userId: string
    ): Promise<IResponse<FollowerResponseDto | null>> {
        try {
            // Kiểm tra mối quan hệ theo dõi giữa người dùng chính và người dùng được theo dõi
            const follow = await this.followerRepository.findOne({
                where: { user_1: { id: mainUser }, user_2: { id: userId } },
            });

            const followed = await this.followerRepository.findOne({
                where: { user_1: { id: userId }, user_2: { id: mainUser } },
            });
            
            if (!follow && !followed) {
                return ResponseUtil.error(
                    'Không tìm thấy mối quan hệ theo dõi giữa hai người dùng',
                    HttpStatus.NOT_FOUND,
                );
            }
            
            // Cập nhật trạng thái theo dõi nếu có 
            let updatedFollow: Follower | null = null;
            if (follow) {
                follow.isFollow = !follow.isFollow;
                updatedFollow = await this.followerRepository.save(follow);
            } else if (followed) {
                followed.isFollowed = !followed.isFollowed;
                updatedFollow = await this.followerRepository.save(followed);
            }

            if (!updatedFollow) {
                return ResponseUtil.error(
                    'Không thể cập nhật trạng thái theo dõi',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            if (updatedFollow.isFollow === false && updatedFollow.isFollowed === false) {
                this.followerRepository.delete(updatedFollow.id);
                // Trả về thông báo hủy theo dõi
                return ResponseUtil.success(
                    null,
                    'Đã hủy theo dõi người dùng này',
                );
            }
            const responseDto = FollowerMapper.toResponseDto(updatedFollow);
            return ResponseUtil.success(responseDto, 'Trạng thái theo dõi đã được cập nhật');
        } catch (error) {
            if (error instanceof Error) {
                return ResponseUtil.error(
                    `Lỗi khi cập nhật trạng thái theo dõi: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            throw error;
        }
    }
}