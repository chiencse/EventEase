export interface IResponse<T> {
    status: boolean;
    code: number;
    path: string;
    timestamp: string;
    message: string;
    data: T | null;
} 