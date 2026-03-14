export type TUser = {
    name: string;
    email: string;
    role: 'STUDENT' | 'SPONSOR';
    image?: string;
    bio?: string;
    university?: string;
};