import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req, ParseBoolPipe, BadRequestException } from '@nestjs/common';
import { FollowerService } from '../service/follower.service';
import { CreateFollowerDto } from '../dto/follower.dto';
import { FollowerResponseDto, FollowerUserDto } from '../dto/follower-response.dto';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IResponse } from 'src/common/interfaces/response.interface';
import { getUserId } from 'src/common/utils/user.util';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('follower')
@ApiTags('Follower')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class FollowerController {
    constructor(private readonly followerService: FollowerService) { }

    @Post()
    @ApiOperation({
        summary: 'Thêm mối quan hệ theo dõi',
        description: 'Tạo mối quan hệ theo dõi giữa người dùng hiện tại và người dùng khác'
    })
    @ApiResponse({
        status: 201,
        description: 'Tạo mối quan hệ theo dõi thành công',
        type: FollowerResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Mối quan hệ đã tồn tại hoặc dữ liệu không hợp lệ'
    })
    async create(
        @Body() createFollowerDto: CreateFollowerDto,
        @Req() request: RequestWithUser
    ): Promise<IResponse<FollowerResponseDto | null>> {
        const userId = await getUserId(request);
        return this.followerService.create(userId, createFollowerDto);
    }

    @Get(':userId')
    @ApiOperation({
        summary: 'Kiểm tra trạng thái theo dõi với người dùng khác',
        description: 'Kiểm tra xem người dùng hiện tại có theo dõi người dùng khác hay không.'
    })
    @ApiParam({
        name: 'userId',
        description: 'ID của nguời dùng cần kiểm tra',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về trạng thái theo dõi của người dùng',
        schema: {
            properties: {
                isFollow: {
                    type: 'boolean',
                    description: 'true nếu đã theo dõi, false nếu chưa'
                },
                isCreated: {
                    type: 'boolean',
                    description: 'true nếu đã tạo mối quan hệ, false nếu chưa'
                }
            }
        }
    })
    async isEventFavourited(
        @Param('userId') userId: string,
        @Req() request: RequestWithUser
    ): Promise<IResponse<{ isFollow: boolean, isCreated: boolean } | null>> {
        const mainUser = await getUserId(request);
        return this.followerService.followStatus(mainUser, userId);
    }

    @Get('count')
    @ApiOperation({
        summary: 'Lấy số lượng người theo dõi và đang theo dõi của bản thân',
        description: 'Lấy tổng số người mà người dùng hiện tại đang theo dõi và được theo dõi'
    })
    @ApiResponse({
        status: 200,
        description: 'Trả về số lượng người theo dõi và đang theo dõi',
        schema: {
            properties: {
                followingCount: {
                    type: 'number',
                    description: 'Số người đang theo dõi'
                },
                followersCount: {
                    type: 'number',
                    description: 'Số người theo dõi mình'
                }
            }
        }
    })
    async getFollowCount(
        @Req() request: RequestWithUser,
    ): Promise<IResponse<{ followingCount: number; followersCount: number } | null>> {
        const currentUserId = await getUserId(request);
        return this.followerService.getFollowCount(currentUserId);
    }

    @Get('follow-list')
    @ApiOperation({
        summary: 'Lấy danh sách người dùng mà bản thân đang theo dõi',
        description: 'Lấy danh sách người dùng mà người hiện tại đã follow, có phân trang.'
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Số trang (mặc định: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Số lượng item trên mỗi trang (mặc định: 10)'
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách người dùng đang được theo dõi',
        type: FollowerUserDto,
        isArray: false
    })
    async getFollowList(
        @Req() request: RequestWithUser,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: FollowerUserDto[]; total: number; page: number; limit: number } | null>> {
        const userId = await getUserId(request);
        return this.followerService.getFollowList(userId, page, limit);
    }

    @Patch(':userId')
    @ApiOperation({
        summary: 'Cập nhật trạng thái theo dõi với người dùng khác',
        description: 'Cho phép người dùng cập nhật trạng thái theo dõi với người dùng khác.'
    })
    @ApiParam({
        name: 'userId',
        description: 'ID của người dùng cần cập nhật trạng thái theo dõi',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Trạng thái theo dõi đã được cập nhật',
        type: FollowerResponseDto
    }) 
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy mối quan hệ theo dõi giữa hai người dùng'
    })
    async update(
        @Param('userId') userId: string,
        @Req() request: RequestWithUser
    ): Promise<IResponse<FollowerResponseDto | null>> {
        const mainUser = await getUserId(request);
        return this.followerService.update(mainUser, userId);
    }

    @Get('followers')
    @ApiOperation({
        summary: 'Lấy danh sách người đang theo dõi mình',
        description: 'Lấy danh sách người dùng đang theo dõi người dùng hiện tại, có phân trang.'
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Số trang (mặc định: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Số lượng item trên mỗi trang (mặc định: 10)'
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách người dùng đang theo dõi mình',
        type: FollowerUserDto,
        isArray: false
    })
    async getFollowers(
        @Req() request: RequestWithUser,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: FollowerUserDto[]; total: number; page: number; limit: number } | null>> {
        const userId = await getUserId(request);
        return this.followerService.getFollowers(userId, page, limit);
    }

    @Get('user/:userId/stats')
    @ApiOperation({
        summary: 'Lấy thống kê theo dõi của một người dùng',
        description: 'Lấy số lượng người đang theo dõi và được theo dõi của một người dùng cụ thể'
    })
    @ApiParam({
        name: 'userId',
        description: 'ID của người dùng cần lấy thống kê',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'Thống kê theo dõi của người dùng',
        schema: {
            properties: {
                followingCount: {
                    type: 'number',
                    description: 'Số người đang theo dõi'
                },
                followersCount: {
                    type: 'number',
                    description: 'Số người theo dõi'
                }
            }
        }
    })
    async getUserFollowStats(
        @Param('userId') userId: string
    ): Promise<IResponse<{ followingCount: number; followersCount: number } | null>> {
        return this.followerService.getUserFollowStats(userId);
    }

    @Get('user/:userId/following')
    @ApiOperation({
        summary: 'Lấy danh sách người mà một người dùng đang theo dõi',
        description: 'Lấy danh sách người dùng mà một người dùng cụ thể đang theo dõi, có phân trang'
    })
    @ApiParam({
        name: 'userId',
        description: 'ID của người dùng cần lấy danh sách',
        type: String
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Số trang (mặc định: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Số lượng item trên mỗi trang (mặc định: 10)'
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách người dùng đang được theo dõi',
        type: FollowerUserDto,
        isArray: false
    })
    async getUserFollowing(
        @Param('userId') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: FollowerUserDto[]; total: number; page: number; limit: number } | null>> {
        return this.followerService.getUserFollowing(userId, page, limit);
    }

    @Get('user/:userId/followers')
    @ApiOperation({
        summary: 'Lấy danh sách người đang theo dõi một người dùng',
        description: 'Lấy danh sách người dùng đang theo dõi một người dùng cụ thể, có phân trang'
    })
    @ApiParam({
        name: 'userId',
        description: 'ID của người dùng cần lấy danh sách',
        type: String
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Số trang (mặc định: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Số lượng item trên mỗi trang (mặc định: 10)'
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách người dùng đang theo dõi',
        type: FollowerUserDto,
        isArray: false
    })
    async getUserFollowers(
        @Param('userId') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ): Promise<IResponse<{ data: FollowerUserDto[]; total: number; page: number; limit: number } | null>> {
        return this.followerService.getUserFollowers(userId, page, limit);
    }
}
