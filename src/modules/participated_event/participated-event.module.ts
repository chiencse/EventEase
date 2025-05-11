import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipatedEvent } from './entities/participated-event.entity';
import { ParticipatedEventService } from './service/participated-event.service';
import { ParticipatedEventController } from './controller/participated-event.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ParticipatedEvent])],
    controllers: [ParticipatedEventController],
    providers: [ParticipatedEventService],
    exports: [ParticipatedEventService]
})
export class ParticipatedEventModule {} 