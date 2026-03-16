export type TReview = {
    projectId: string;
    revieweeId: string; // The person receiving the review
    rating: number;     // 1 to 5
    comment?: string;
};