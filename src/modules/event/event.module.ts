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
import { Hashtag } from './entities/hashtag.entity';
import { EventHashtag } from './entities/event-hashtag.entity';
import { HashtagService } from './service/hashtag.service';
import { HashtagController } from './controller/hashtag.controller';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, ImageEvent, TrackedEvent, Hashtag, EventHashtag]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRATION },
      }),
    }),
    S3Module,
    UserModule
  ],
  controllers: [EventController, HashtagController],
  providers: [
    EventService,
    HashtagService
  ],
  exports: [EventService, HashtagService]
})
export class EventModule {}