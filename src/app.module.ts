import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import dataSource from 'src/database/ormconfig';
import { UserModule } from './modules/user/user.module';
import { EventModule } from './modules/event/event.module';
import { TrackedEventModule } from './modules/tracked_event/tracked-event.module';
import { FavouriteEventModule } from './modules/favourite_event/favourite-event.module';
import { ParticipatedEventModule } from './modules/participated_event/participated-event.module';
import { S3Service } from './common/s3/s3.service';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
/**
 * AppModule là module gốc của toàn bộ ứng dụng NestJS.
 * Tại đây sẽ cấu hình:
 * - Biến môi trường
 * - Kết nối CSDL (TypeORM)
 * - JWT xác thực
 * - Module chức năng (ví dụ: EventModule)
 * - Các provider dùng toàn app (ví dụ: S3Service)
 */
@Module({
  imports: [
    // Load biến môi trường từ file .env, dùng toàn app
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),

    // Kết nối cơ sở dữ liệu qua TypeORM, dùng cấu hình từ ormconfig.ts
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...dataSource.options,
      }),
    }),

    // Đăng ký JWT toàn ứng dụng (dùng cho xác thực người dùng)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRATION },
      }),
    }),

    // Các module nghiệp vụ
    AuthModule,
    UserModule,
    EventModule,
    TrackedEventModule,
    FavouriteEventModule,
    ParticipatedEventModule,
  ],

  // Controller gốc
  controllers: [],

  // Provider dùng toàn cục (AppService, S3Service, v.v.)
  providers: [AppService, S3Service],

  // Cho phép export S3Service để dùng ở module khác
  exports: [S3Service],
})

/**
 * AppModule là module gốc của ứng dụng.
 * Tại đây sẽ cấu hình các module, controller, provider cần thiết cho toàn bộ ứng dụng.
 */
export class AppModule implements NestModule {
  constructor(private readonly appService: AppService) {
    console.log('AppModule initialized');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes('*');
  }
}
