import { EventResponseDto } from "src/modules/event/dto/response/event-response.dto";

export interface ITrackedEvent {
    eventId: number;
    userId: number;
}

export interface ITrackedEventResponse {
    id: number;
    eventId: number;
    userId: number;
    event: EventResponseDto | null;
}