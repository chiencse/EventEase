import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { S3Service } from 'src/common/s3/s3.service';
import { User } from './entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User])
    ],
    controllers: [UserController],
    providers: [UserService, S3Service],
    exports: [UserService] // Export để các module khác có thể sử dụng UserService
})
export class UserModule {} 