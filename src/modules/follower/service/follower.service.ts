import { Injectable, HttpStatus } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Follower } from '../entities/follower.entity';
import { CreateFollowerDto } from '../dto/follower.dto';
import {
  FollowerResponseDto,
  FollowerUserDto,
  SuggestionFollowerDto,
} from '../dto/follower-response.dto';
import { FollowerMapper } from '../mappers/follower.mapper';
import { IResponse } from 'src/common/interfaces/response.interface';
import { ResponseUtil } from 'src/common/utils/response.util';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class FollowerService {
  constructor(
    @InjectRepository(Follower)
    private readonly followerRepository: Repository<Follower>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
        `Lỗi khi tạo quan hệ mới: ${
          error instanceof Error ? error.message : 'Không xác định'
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
   * Lấy số lượng người theo dõi và đang theo dõi của người dùng
   * @param userId - ID người dùng
   * @returns Số lượng người đang theo dõi và được theo dõi
   */
  async getFollowCount(
    userId: string,
  ): Promise<
    IResponse<{ followingCount: number; followersCount: number } | null>
  > {
    try {
      const [followingCount, followersCount] = await Promise.all([
        this.followerRepository.count({
          where: {
            user_1: { id: userId },
            isFollow: true,
          },
        }),
        this.followerRepository.count({
          where: {
            user_2: { id: userId },
            isFollowed: true,
          },
        }),
      ]);

      return ResponseUtil.success({
        followingCount,
        followersCount,
      });
    } catch (error) {
      return ResponseUtil.error(
        `Lỗi khi lấy số lượng người theo dõi: ${error instanceof Error ? error.message : 'Không xác định'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
    limit: number = 10,
  ): Promise<
    IResponse<{
      data: FollowerUserDto[];
      total: number;
      page: number;
      limit: number;
    } | null>
  > {
    try {
      const [followRecords, total] = await this.followerRepository.findAndCount(
        {
          where: {
            user_1: { id: userId },
            isFollow: true,
          },
          relations: ['user_2'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        },
      );

      const responseDto: FollowerUserDto[] = followRecords.map((follow) => ({
        user: {
          id: follow.user_2.id,
          firstName: follow.user_2.firstName,
          lastName: follow.user_2.lastName,
          avatar: follow.user_2.avatar,
        },
        createdAt: follow.createdAt,
      }));

      return ResponseUtil.success({
        data: responseDto,
        total,
        page,
        limit,
      });
    } catch (error) {
      if (error instanceof Error) {
        return ResponseUtil.error(
          `Lỗi khi lấy danh sách người đang theo dõi: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách người đang theo dõi mình
   * @param userId - ID người dùng
   * @param page - Số trang
   * @param limit - Số lượng item trên mỗi trang
   * @returns Danh sách người đang theo dõi và thông tin phân trang
   */
  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<
    IResponse<{
      data: FollowerUserDto[];
      total: number;
      page: number;
      limit: number;
    } | null>
  > {
    try {
      const [followRecords, total] = await this.followerRepository.findAndCount(
        {
          where: {
            user_2: { id: userId },
            isFollowed: true,
          },
          relations: ['user_1'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        },
      );

      const responseDto: FollowerUserDto[] = followRecords.map((follow) => ({
        user: {
          id: follow.user_1.id,
          firstName: follow.user_1.firstName,
          lastName: follow.user_1.lastName,
          avatar: follow.user_1.avatar,
        },
        createdAt: follow.createdAt,
      }));

      return ResponseUtil.success({
        data: responseDto,
        total,
        page,
        limit,
      });
    } catch (error) {
      return ResponseUtil.error(
        `Lỗi khi lấy danh sách người theo dõi: ${error instanceof Error ? error.message : 'Không xác định'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
    userId: string,
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

      if (
        updatedFollow.isFollow === false &&
        updatedFollow.isFollowed === false
      ) {
        this.followerRepository.delete(updatedFollow.id);
        // Trả về thông báo hủy theo dõi
        return ResponseUtil.success(null, 'Đã hủy theo dõi người dùng này');
      }
      const responseDto = FollowerMapper.toResponseDto(updatedFollow);
      return ResponseUtil.success(
        responseDto,
        'Trạng thái theo dõi đã được cập nhật',
      );
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

  /**
   * Lấy thống kê theo dõi của một người dùng
   * @param userId - ID người dùng cần lấy thống kê
   * @returns Số lượng người đang theo dõi và được theo dõi
   */
  async getUserFollowStats(
    userId: string,
  ): Promise<
    IResponse<{ followingCount: number; followersCount: number } | null>
  > {
    try {
      const [followingCount, followersCount] = await Promise.all([
        this.followerRepository.count({
          where: {
            user_1: { id: userId },
            isFollow: true,
          },
        }),
        this.followerRepository.count({
          where: {
            user_2: { id: userId },
            isFollowed: true,
          },
        }),
      ]);

      return ResponseUtil.success({
        followingCount,
        followersCount,
      });
    } catch (error) {
      return ResponseUtil.error(
        `Lỗi khi lấy thống kê theo dõi: ${error instanceof Error ? error.message : 'Không xác định'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lấy danh sách người mà một người dùng đang theo dõi
   * @param userId - ID người dùng cần lấy danh sách
   * @param page - Số trang
   * @param limit - Số lượng item trên mỗi trang
   * @returns Danh sách người dùng đang được theo dõi
   */
  async getUserFollowing(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<
    IResponse<{
      data: FollowerUserDto[];
      total: number;
      page: number;
      limit: number;
    } | null>
  > {
    try {
      const [followRecords, total] = await this.followerRepository.findAndCount(
        {
          where: {
            user_1: { id: userId },
            isFollow: true,
          },
          relations: ['user_2'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        },
      );

      const responseDto: FollowerUserDto[] = followRecords.map((follow) => ({
        user: {
          id: follow.user_2.id,
          firstName: follow.user_2.firstName,
          lastName: follow.user_2.lastName,
          avatar: follow.user_2.avatar,
        },
        createdAt: follow.createdAt,
      }));

      return ResponseUtil.success({
        data: responseDto,
        total,
        page,
        limit,
      });
    } catch (error) {
      return ResponseUtil.error(
        `Lỗi khi lấy danh sách người đang theo dõi: ${error instanceof Error ? error.message : 'Không xác định'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lấy danh sách người đang theo dõi một người dùng
   * @param userId - ID người dùng cần lấy danh sách
   * @param page - Số trang
   * @param limit - Số lượng item trên mỗi trang
   * @returns Danh sách người dùng đang theo dõi
   */
  async getUserFollowers(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<
    IResponse<{
      data: FollowerUserDto[];
      total: number;
      page: number;
      limit: number;
    } | null>
  > {
    try {
      const [followRecords, total] = await this.followerRepository.findAndCount(
        {
          where: {
            user_2: { id: userId },
            isFollowed: true,
          },
          relations: ['user_1'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        },
      );

      const responseDto: FollowerUserDto[] = followRecords.map((follow) => ({
        user: {
          id: follow.user_1.id,
          firstName: follow.user_1.firstName,
          lastName: follow.user_1.lastName,
          avatar: follow.user_1.avatar,
        },
        createdAt: follow.createdAt,
      }));

      return ResponseUtil.success({
        data: responseDto,
        total,
        page,
        limit,
      });
    } catch (error) {
      return ResponseUtil.error(
        `Lỗi khi lấy danh sách người theo dõi: ${error instanceof Error ? error.message : 'Không xác định'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Kiểm tra người dùng có phải là chính mình không
   * @param currentUserId - ID người dùng hiện tại
   * @param targetUserId - ID người dùng cần kiểm tra
   * @returns Kết quả kiểm tra
   */
  async checkIsSelf(
    currentUserId: string,
    targetUserId: string,
  ): Promise<IResponse<{ isSelf: boolean } | null>> {
    try {
      const isSelf = currentUserId === targetUserId;
      return ResponseUtil.success(
        { isSelf },
        isSelf
          ? 'Đây là tài khoản của bạn'
          : 'Đây không phải tài khoản của bạn',
      );
    } catch (error) {
      if (error instanceof Error) {
        return ResponseUtil.error(
          `Lỗi khi kiểm tra: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw error;
    }
  }

  async getSuggestedFollows(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IResponse<SuggestionFollowerDto[]>> {
    try {
      // Lấy các người bạn bạn đang theo dõi
      const following = await this.followerRepository.find({
        where: { user_1_id: userId, isFollow: true },
        relations: ['user_2'],
      });

      // Nếu chưa follow ai, lấy ngẫu nhiên người dùng
      if (following.length === 0) {
        const queryBuilder = this.userRepository
          .createQueryBuilder('user')
          .where('user.id != :userId', { userId })
          .orderBy('RANDOM()');

        const totalItems = await queryBuilder.getCount();
        const skip = (page - 1) * limit;

        const allUsers = await queryBuilder
          .skip(skip)
          .take(limit)
          .getMany();

        return ResponseUtil.success(
          allUsers.map((user) => ({
            id: user.id,
            name: `${user.lastName} ${user.firstName}`,
            avatar: user.avatar,
            mutualFriend: '',
            createdAt: new Date(),
          }))
        );
      }

      const followingIds = following.map((f) => f.user_2_id);

      // Tìm những người mà bạn bè của bạn đang follow
      const queryBuilder = this.followerRepository
        .createQueryBuilder('f')
        .innerJoinAndSelect('f.user_2', 'suggestedUser')
        .where('f.user_1_id IN (:...followingIds)', { followingIds })
        .andWhere('f.isFollow = true')
        .andWhere('f.user_2_id != :userId', { userId })
        .andWhere((qb) => {
          const sub = qb
            .subQuery()
            .select('1')
            .from(Follower, 'existing')
            .where('existing.user_1_id = :userId')
            .andWhere('existing.user_2_id = f.user_2_id')
            .andWhere('existing.isFollow = true')
            .getQuery();
          return `NOT EXISTS ${sub}`;
        });

      const totalItems = await queryBuilder.getCount();

      // Nếu không tìm thấy gợi ý từ bạn bè, lấy ngẫu nhiên người dùng khác
      if (totalItems === 0) {
        const otherUsersQuery = this.userRepository
          .createQueryBuilder('user')
          .where('user.id != :userId', { userId })
          .andWhere('user.id NOT IN (:...followingIds)', { followingIds: [...followingIds, userId] })
          .orderBy('RANDOM()');

        const totalOtherUsers = await otherUsersQuery.getCount();
        const skip = (page - 1) * limit;

        const otherUsers = await otherUsersQuery
          .skip(skip)
          .take(limit)
          .getMany();

        return ResponseUtil.success(
          otherUsers.map((user) => ({
            id: user.id,
            name: `${user.lastName} ${user.firstName}`,
            avatar: user.avatar,
            mutualFriend: '',
            createdAt: new Date(),
          }))
        );
      }

      // Lấy danh sách gợi ý với phân trang
      const skip = (page - 1) * limit;
      const suggestionsRaw = await queryBuilder
        .skip(skip)
        .take(limit)
        .getMany();

      // Map người gợi ý (mutual friend) đầu tiên cho mỗi suggested user
      const resultMap = new Map<string, SuggestionFollowerDto>();

      for (const item of suggestionsRaw) {
        const suggested = item.user_2;
        if (!resultMap.has(suggested.id)) {
          // Tìm tên người bạn mutual đã gợi ý
          const mutualFriend = following.find(
            (f) => f.user_1_id === userId && f.user_2_id === item.user_1_id,
          );
          resultMap.set(suggested.id, {
            id: suggested.id,
            name: `${suggested.lastName} ${suggested.firstName}`,
            avatar: suggested.avatar,
            mutualFriend:
              mutualFriend?.user_2?.lastName +
              ' ' +
              mutualFriend?.user_2?.firstName || 'Người dùng ẩn danh',
            createdAt: item.createdAt,
          });
        }
      }

      return ResponseUtil.success([...resultMap.values()]);
    } catch (error) {
      if (error instanceof Error) {
        return {
          status: false,
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Lỗi khi lấy danh sách gợi ý: ${error.message}`,
          data: [],
          timestamp: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  /**
   * Tìm kiếm người dùng thông minh
   * - Tìm theo tên, họ tương tự
   * - Loại trừ bản thân
   * - Có phân trang
   * @param userId - ID người dùng hiện tại
   * @param searchTerm - Từ khóa tìm kiếm
   * @param page - Số trang (mặc định: 1)
   * @param limit - Số lượng item mỗi trang (mặc định: 10)
   * @returns Danh sách người dùng phù hợp
   */
  async searchUsers(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IResponse<{
    items: FollowerUserDto[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }>> {
    try {
      // Chuẩn hóa từ khóa tìm kiếm
      const normalizedSearch = searchTerm.trim().toLowerCase();
      
      // Tách từ khóa thành các từ riêng lẻ
      const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);

      // Tạo query builder
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .where('user.id != :userId', { userId });

      // Thêm điều kiện tìm kiếm cho từng từ
      if (searchWords.length > 0) {
        const conditions = searchWords.map((word, index) => {
          const paramName = `search${index}`;
          return `(
            LOWER(user.firstName) LIKE LOWER(:${paramName}) OR
            LOWER(user.lastName) LIKE LOWER(:${paramName}) OR
            LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:${paramName}) OR
            LOWER(CONCAT(user.lastName, ' ', user.firstName)) LIKE LOWER(:${paramName})
          )`;
        });

        queryBuilder.andWhere(`(${conditions.join(' AND ')})`);

        // Thêm tham số cho từng từ
        searchWords.forEach((word, index) => {
          queryBuilder.setParameter(`search${index}`, `%${word}%`);
        });
      }

      // Lấy tổng số items
      const totalItems = await queryBuilder.getCount();

      // Tính toán offset
      const skip = (page - 1) * limit;

      // Lấy danh sách người dùng với phân trang
      const users = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('user.createdAt', 'DESC')
        .getMany();

      // Chuyển đổi sang DTO
      const items: FollowerUserDto[] = users.map(user => ({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        },
        createdAt: user.createdAt
      }));

      // Tính toán thông tin phân trang
      const totalPages = Math.ceil(totalItems / limit);
      const itemCount = items.length;

      return ResponseUtil.success({
        items,
        meta: {
          totalItems,
          itemCount,
          itemsPerPage: limit,
          totalPages,
          currentPage: page
        }
      }, 'Tìm kiếm người dùng thành công');
    } catch (error) {
      if (error instanceof Error) {
        return {
          status: false,
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Lỗi khi tìm kiếm người dùng: ${error.message}`,
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
          timestamp: new Date().toISOString()
        };
      }
      throw error;
    }
  }
}
