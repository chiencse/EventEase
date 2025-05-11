import { Module } from '@nestjs/common';
import { EventService } from './service/event.service';
import { EventController } from './controller/event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { ImageEvent } from './entities/image-event.entity';
import { TrackedEvent } from '../tracked_event/entities/tracked-event.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from 'src/common/s3/s3.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, ImageEvent, TrackedEvent]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRATION },
      }),
    }),
    S3Module
  ],
  controllers: [EventController,],
  providers: [
    EventService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    }
  ],
  exports: [EventService,]
})
export class EventModule {}