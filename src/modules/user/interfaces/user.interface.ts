export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    email: string;
    location?: string;
    phoneNumber?: string;
    avatar?: string;
    username: string;
    password: string;
}

export interface ICreateUser {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    email: string;
    location?: string;
    phoneNumber?: string;
    username: string;
    password: string;
}

