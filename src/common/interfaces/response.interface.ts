export interface IResponse<T> {
    status: boolean;
    code: number;
    timestamp: string;
    message: string;
    data: T | null;
} 