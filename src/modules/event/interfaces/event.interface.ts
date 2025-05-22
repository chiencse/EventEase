// src/modules/event/interfaces/event.interface.ts
import { File as MulterFile } from 'multer';
import { IImageInfo } from './image-infi.interface';

export interface IEvent {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    participantNumber: number;
    position: string;
    hashtags?: string[];
    images?: MulterFile[];
}

export interface IEventResponse {
    id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    participantNumber: number;
    position: string;
    hashtags: string[];
    images?: IImageInfo[];
}