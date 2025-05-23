import { EventResponseDto } from "src/modules/event/dto/response/event-response.dto";

export interface ITrackedEvent {
    eventId: string;
}

export interface ITrackedEventResponse {
    id: number;
    eventId: string;
    userId: string;
    event: EventResponseDto | null;
}