import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req, ParseBoolPipe } from '@nestjs/common';
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
        summary: 'Thêm mối quan hệ theo dõi giữa người dùng với nhau',
        description: 'Cho phép người dùng theo dõi một người dùng khác. Hệ thống sẽ kiểm tra liệu người dùng đã tạo quan hệ với người dùng này hay chưa.'
    })
    @ApiResponse({
        status: 201,
        description: 'Mối quan hệ đã được khởi tạo',
        type: FollowerResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Mối quan hệ đã tồn tại'
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

    @Get('count/:userId')
    @ApiOperation({
        summary: 'Lấy số lượng người bản thân đang theo dõi',
        description: 'Lấy tổng số người mà người dùng hiện tại đang theo dõi hoặc được theo dõi.'
    })
    @ApiQuery({
        name: 'follow',
        required: true,
        type: Boolean,
        description: 'true nếu muốn đếm người bạn đang theo dõi, false nếu đếm người theo dõi bạn'
      })
    @ApiResponse({
        status: 200,
        description: 'Trả về số lượng người đang theo dõi hoặc được theo dõi',
        schema: {
            properties: {
                count: {
                    type: 'number',
                    description: 'Số lượng người đang theo dõi'
                }
            }
        }
    })
    async getCount(
        @Query('follow', ParseBoolPipe) follow: boolean,
        @Req() request: RequestWithUser,
    ): Promise<IResponse<{ count: number } | null>> {
        const mainUser = await getUserId(request);
        return this.followerService.getCount(mainUser, follow);
    }

    @Get('follow-list/:userId')
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
}
