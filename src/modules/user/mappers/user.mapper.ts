import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { IUser } from '../interfaces/user.interface';
import * as bcrypt from 'bcrypt';

export class UserMapper {
    /**
     * Chuyển đổi chuỗi ngày tháng sang Date object
     * @param dateString Chuỗi ngày tháng (DD-MM-YYYY hoặc DD/MM/YYYY)
     * @returns Date object hoặc undefined
     */
    private static parseDate(dateString?: string): Date | undefined {
        if (!dateString) return undefined;
        
        // Tách ngày, tháng, năm từ chuỗi
        const [day, month, year] = dateString.split(/[-/]/);
        
        // Tạo Date object (tháng trong JS bắt đầu từ 0)
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    /**
     * Chuyển đổi từ User entity sang UserResponseDto
     * @param user User entity
     * @returns UserResponseDto
     */
    static toResponseDto(user: User): UserResponseDto {
        const responseDto = new UserResponseDto();
        Object.assign(responseDto, {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            dateOfBirth: user.dateOfBirth,
            email: user.email,
            location: user.location,
            phoneNumber: user.phoneNumber,
            username: user.username
        });
        return responseDto;
    }

    /**
     * Chuyển đổi từ danh sách User entity sang danh sách UserResponseDto
     * @param users Danh sách User entity
     * @returns Danh sách UserResponseDto
     */
    static toResponseDtoList(users: User[]): UserResponseDto[] {
        return users.map(user => this.toResponseDto(user));
    }

    /**
     * Chuyển đổi từ CreateUserDto sang User entity
     * @param createUserDto CreateUserDto
     * @returns User entity
     */
    static async toEntity(createUserDto: CreateUserDto): Promise<User> {
        const user = new User();
        Object.assign(user, {
            ...createUserDto,
            dateOfBirth: this.parseDate(createUserDto.dateOfBirth)
        });
        
        // Không cần mã hóa mật khẩu ở đây vì đã được mã hóa trong UserService
        return user;
    }

    /**
     * Chuyển đổi từ IUser sang User entity
     * @param userData IUser
     * @returns User entity
     */
    static toEntityFromInterface(userData: IUser): User {
        const user = new User();
        Object.assign(user, userData);
        return user;
    }

    /**
     * Chuyển đổi từ User entity sang IUser
     * @param user User entity
     * @returns IUser
     */
    static toInterface(user: User): IUser {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            dateOfBirth: user.dateOfBirth,
            email: user.email,
            location: user.location,
            phoneNumber: user.phoneNumber,
            username: user.username,
            password: user.password,
        };
    }
}