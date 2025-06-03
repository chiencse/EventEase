import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
  Put,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { File as MulterFile } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserService } from '../service/user.service';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { UpdatePasswordDto } from '../dto/request/update-password.dto';
import { UserAvatarDto } from '../dto/request/user-avatar.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { IResponse } from 'src/common/interfaces/response.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { getUserId } from 'src/common/utils/user.util';
import { RequestWithUser } from 'src/common/types/request-with-user.interface';
import { RegisterDto } from '../dto/request/register.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  private readonly logger = new Logger(UserController.name);

  /**
   * Tạo người dùng mới
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo người dùng thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email hoặc username đã tồn tại',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<IResponse<UserResponseDto>> {
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
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập',
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
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập',
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
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email hoặc username đã tồn tại',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ): Promise<IResponse<UserResponseDto>> {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Cập nhật mật khẩu người dùng
   */
  @Put('update-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật mật khẩu người dùng' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật mật khẩu thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Mật khẩu cũ không đúng',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Mật khẩu xác nhận không khớp',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập',
  })
  async updatePassword(
    @Req() request: RequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<IResponse<{ updated: boolean } | null>> {
    const id = await getUserId(request);
    return this.userService.updatePassword(id, updatePasswordDto);
  }

  /**
   * Cập nhật avatar người dùng
   * @param file - Ảnh đại diện mới
   * @returns Ảnh đại diện của người dùng sau khi cập nhật và thông tin người dùng
   */
  @Put('update-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật avatar người dùng' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật avatar thành công',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Người dùng không thể cập nhật avatar',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập',
  })
  @UseInterceptors(FilesInterceptor('avatar', 1)) // Ensure 'avatar' field is handled
  async updateAvatar(
    @Req() request: RequestWithUser,
    @Body() userAvatarDto: UserAvatarDto,
    @UploadedFiles() files: MulterFile, // Use correct type for files
  ): Promise<IResponse<UserResponseDto>> {
    this.logger.debug('Start API');
    const id = await getUserId(request);
    this.logger.debug(`Updating avatar for user ID: ${id}`);

    if (!files || files.length === 0) {
      this.logger.error('No file uploaded');
      throw new Error('No file uploaded');
    }

    const file = files[0]; // Get the first file
    this.logger.debug(
      `Received file: ${file.originalname}, size: ${file.size}`,
    );
    userAvatarDto.avatar = file;

    return this.userService.updateAvatar(id, userAvatarDto);
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
    description: 'Xóa người dùng thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<IResponse<{ deleted: boolean }>> {
    return this.userService.remove(id);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email/username đã tồn tại hoặc mật khẩu không khớp' })
  async register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto);
  }

  @Put('phone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật số điện thoại',
    description: 'Cập nhật số điện thoại của người dùng hiện tại'
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật số điện thoại thành công',
    schema: {
      example: {
        status: true,
        code: 200,
        timestamp: '2025-06-03T06:11:00.111Z',
        message: 'Cập nhật số điện thoại thành công',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '0123456789',
          avatar: 'https://example.com/avatar.jpg',
          createdAt: '2025-06-03T06:11:00.111Z',
          updatedAt: '2025-06-03T06:11:00.111Z'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          example: '0123456789',
          description: 'Số điện thoại mới (10 số)'
        }
      },
      required: ['phone']
    }
  })
  async updatePhone(
    @Req() request: RequestWithUser,
    @Body('phone') phone: string
  ): Promise<IResponse<UserResponseDto | null>> {
    const currentUserId = await getUserId(request);
    return this.userService.updatePhone(currentUserId, phone);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin cá nhân',
    description: 'Cập nhật thông tin cá nhân của người dùng hiện tại'
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin cá nhân thành công',
    schema: {
      example: {
        status: true,
        code: 200,
        timestamp: '2025-06-03T06:11:00.111Z',
        message: 'Cập nhật thông tin cá nhân thành công',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '0123456789',
          avatar: 'https://example.com/avatar.jpg',
          dateOfBirth: '1990-01-01',
          address: '123 Street, City',
          createdAt: '2025-06-03T06:11:00.111Z',
          updatedAt: '2025-06-03T06:11:00.111Z'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          example: 'John',
          description: 'Tên'
        },
        lastName: {
          type: 'string',
          example: 'Doe',
          description: 'Họ'
        },
        dateOfBirth: {
          type: 'string',
          format: 'date',
          example: '1990-01-01',
          description: 'Ngày sinh (YYYY-MM-DD)'
        },
        address: {
          type: 'string',
          example: '123 Street, City',
          description: 'Địa chỉ'
        },
        email: {
          type: 'string',
          format: 'email',
          example: 'john@example.com',
          description: 'Email mới'
        }
      }
    }
  })
  async updateProfile(
    @Req() request: RequestWithUser,
    @Body() updateData: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: Date;
      address?: string;
      email?: string;
    }
  ): Promise<IResponse<UserResponseDto | null>> {
    const currentUserId = await getUserId(request);
    return this.userService.updateProfile(currentUserId, updateData);
  }
}
