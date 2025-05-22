import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackedEvent } from './entities/tracked-event.entity';
import { TrackedEventService } from './service/tracked-event.service';
import { TrackedEventController } from './controller/tracked-event.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([TrackedEvent])
    ],
    controllers: [TrackedEventController],
    providers: [TrackedEventService],
    exports: [TrackedEventService]
})
export class TrackedEventModule {}
