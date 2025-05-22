import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavouriteEvent } from './entities/favourite-event.entity';
import { FavouriteEventService } from './service/favourite-event.service';
import { FavouriteEventController } from './controller/favourite-event.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FavouriteEvent])],
    controllers: [FavouriteEventController],
    providers: [FavouriteEventService],
    exports: [FavouriteEventService]
})
export class FavouriteEventModule {} 