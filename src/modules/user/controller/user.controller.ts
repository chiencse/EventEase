import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../service/user.service';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { IResponse } from 'src/common/interfaces/response.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    /**
     * Tạo người dùng mới
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Tạo người dùng mới' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Tạo người dùng thành công',
        type: UserResponseDto
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email hoặc username đã tồn tại'
    })
    async create(@Body() createUserDto: CreateUserDto): Promise<IResponse<UserResponseDto>> {
        return this.userService.create(createUserDto);
    }

    /**
     * Lấy thông tin người dùng đang đăng nhập
     */
    @Get('my-info')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lấy thông tin người dùng đang đăng nhập' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy thông tin người dùng thành công',
        type: UserResponseDto
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Không có quyền truy cập'
    })
    async getMyInfo(): Promise<IResponse<UserResponseDto>> {
        return this.userService.getMyInfo();
    }

    /**
     * Lấy danh sách tất cả người dùng
     */
    // @Get()
    // @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng' })
    // @ApiResponse({
    //     status: HttpStatus.OK,
    //     description: 'Lấy danh sách người dùng thành công',
    //     type: [UserResponseDto]
    // })
    // async findAll(): Promise<IResponse<UserResponseDto[]>> {
    //     return this.userService.findAll();
    // }

    /**
     * Lấy thông tin người dùng theo ID
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
    @ApiParam({ name: 'id', description: 'ID của người dùng' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy thông tin người dùng thành công',
        type: UserResponseDto
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy người dùng'
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Không có quyền truy cập'
    })
    async findOne(@Param('id') id: string): Promise<IResponse<UserResponseDto>> {
        return this.userService.findOne(id);
    }

    /**
     * Cập nhật thông tin người dùng
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
    @ApiParam({ name: 'id', description: 'ID của người dùng' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cập nhật thông tin người dùng thành công',
        type: UserResponseDto
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy người dùng'
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email hoặc username đã tồn tại'
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Không có quyền truy cập'
    })
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: Partial<CreateUserDto>
    ): Promise<IResponse<UserResponseDto>> {
        return this.userService.update(id, updateUserDto);
    }

    /**
     * Xóa người dùng
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Xóa người dùng' })
    @ApiParam({ name: 'id', description: 'ID của người dùng' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Xóa người dùng thành công'
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy người dùng'
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Không có quyền truy cập'
    })
    async remove(@Param('id') id: string): Promise<IResponse<{ deleted: boolean }>> {
        return this.userService.remove(id);
    }
} 