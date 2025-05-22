// src/modules/event/dto/update-event.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IEvent } from '../../interfaces/event.interface';

export class UpdateEventDto extends PartialType(CreateEventDto) implements Partial<IEvent> {}
