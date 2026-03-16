export type TMilestone = {
    projectId: string;
    title: string;
    description?: string;
    mediaUrl?: string; // Automatically populated by Cloudinary if a file is uploaded
};