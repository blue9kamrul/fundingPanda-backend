export type TProject = {
    title: string;
    description: string;
    goalAmount: number;
    studentId: string; // The ID of the user creating the project
    categories?: string[];
    pitchDocUrl?: string | null;
    images?: string[];
    status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'FUNDED' | 'COMPLETED';
};