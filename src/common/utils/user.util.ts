import { UnauthorizedException } from '@nestjs/common';
import { RequestWithUser } from '../types/request-with-user.interface';

export async function getUserId(request: RequestWithUser): Promise<string> {
    const userId = request?.user?.id;
    if (!userId) {
        throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
    }
    return userId;
}
