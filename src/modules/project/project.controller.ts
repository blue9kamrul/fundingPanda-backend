import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { ProjectService } from './project.service';
import type { TProject } from './project.interface';
import { uploadToCloudinary, deleteFromCloudinary, extractCloudinaryPublicId } from '../../utils/cloudinary';
import AppError from '@/src/errors/AppError';
import { cloudinaryInstance } from '../../config/cloudinary.config';

const assertValidPdfFile = (file: Express.Multer.File) => {
    if (file.mimetype !== 'application/pdf') {
        throw new AppError(400, 'Pitch document must be a valid PDF file');
    }

    if (!file.buffer || file.buffer.length === 0) {
        throw new AppError(400, 'Uploaded PDF appears empty or unreadable');
    }

    // PDF files must start with "%PDF"
    const signature = file.buffer.subarray(0, 4).toString('ascii');
    if (signature !== '%PDF') {
        throw new AppError(400, 'Uploaded pitch document is not a valid PDF binary');
    }
};

const ensureReviewReadiness = (status: unknown, pitchDocUrl: string | null, imageUrls: string[]) => {
    if (status !== 'PENDING') {
        return;
    }

    if (!pitchDocUrl) {
        throw new AppError(400, 'Pitch PDF is required before submitting for review');
    }

    if (!imageUrls || imageUrls.length === 0) {
        throw new AppError(400, 'At least one prototype image is required before submitting for review');
    }
};

const createProject = catchAsync(async (req: Request, res: Response) => {
    const studentId = req.user?.id as string;
    let pitchDocUrl = null;
    const imageUrls: string[] = [];

    // 1. Handle File Uploads (if files were provided)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files) {
        // Upload PDF Document
        if (files.pitchDoc && files.pitchDoc.length > 0) {
            const file = files.pitchDoc[0];
            assertValidPdfFile(file);
            const docUpload = await uploadToCloudinary(file.buffer, 'pitch-docs', 'raw', file.originalname);
            pitchDocUrl = docUpload.secure_url;
        }

        // Upload Images
        if (files.images && files.images.length > 0) {
            for (const file of files.images) {
                const imageUpload = await uploadToCloudinary(file.buffer, 'prototypes', 'image', file.originalname);
                imageUrls.push(imageUpload.secure_url);
            }
        }
    }

    // 2. Combine all data
    const projectData = {
        ...req.body,
        studentId,
        pitchDocUrl, // Add Cloudinary URL to DB
        images: imageUrls, // Add Cloudinary URLs to DB
    };

    ensureReviewReadiness(projectData.status, projectData.pitchDocUrl, projectData.images);

    // 3. Save to Database
    const result = await ProjectService.createProjectIntoDB(projectData);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Project and media created successfully',
        data: result,
    });
});

const getAllProjects = catchAsync(async (req: Request, res: Response) => {
    // Pass the query parameters from the request
    const result = await ProjectService.getAllProjectsFromDB(req.query);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Projects retrieved successfully',
        data: result.data, // Access the data array
        meta: result.meta, // Access the pagination metadata
    });
});

const getMyProjects = catchAsync(async (req: Request, res: Response) => {
    const studentId = req.user?.id as string;
    const result = await ProjectService.getMyProjectsFromDB(studentId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'My projects retrieved successfully',
        data: result,
    });
});

const getMySingleProject = catchAsync(async (req: Request, res: Response) => {
    const studentId = req.user?.id as string;
    const projectId = req.params.id as string;
    const result = await ProjectService.getMySingleProjectFromDB(projectId, studentId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'My project retrieved successfully',
        data: result,
    });
});


const getSingleProject = catchAsync(async (req: Request, res: Response) => {
    const result = await ProjectService.getSingleProjectFromDB(req.params.id as string);
    sendResponse(res, { statusCode: 200, success: true, message: 'Project retrieved successfully', data: result });
});

const buildPitchDocCandidates = (url: string) => {
    const candidates = new Set<string>();
    candidates.add(url);

    const rawVariant = url.replace('/image/upload/', '/raw/upload/');
    candidates.add(rawVariant);

    if (!url.toLowerCase().endsWith('.pdf')) {
        candidates.add(`${url}.pdf`);
    }

    if (!rawVariant.toLowerCase().endsWith('.pdf')) {
        candidates.add(`${rawVariant}.pdf`);
    }

    return Array.from(candidates);
};

const buildPitchDocPublicIdCandidates = (url: string) => {
    const candidates = new Set<string>();

    const normalized = url.replace('/image/upload/', '/raw/upload/');
    const fromNormalized = extractCloudinaryPublicId(normalized, 'raw');
    const fromOriginal = extractCloudinaryPublicId(url, 'raw');

    if (fromNormalized) candidates.add(fromNormalized);
    if (fromOriginal) candidates.add(fromOriginal);

    if (fromNormalized && !fromNormalized.toLowerCase().endsWith('.pdf')) {
        candidates.add(`${fromNormalized}.pdf`);
    }
    if (fromOriginal && !fromOriginal.toLowerCase().endsWith('.pdf')) {
        candidates.add(`${fromOriginal}.pdf`);
    }

    return Array.from(candidates);
};

const canOpenUrl = async (url: string) => {
    try {
        const headRes = await fetch(url, { method: 'HEAD' });
        if (headRes.ok) return true;

        const getRes = await fetch(url, { method: 'GET' });
        return getRes.ok;
    } catch {
        return false;
    }
};

const redirectToPitchDoc = catchAsync(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const pitchDocUrl = await ProjectService.getProjectPitchDocUrlFromDB(projectId);

    if (!pitchDocUrl) {
        throw new AppError(404, 'Pitch PDF not found for this project');
    }

    const candidates = buildPitchDocCandidates(pitchDocUrl);

    for (const candidate of candidates) {
        const reachable = await canOpenUrl(candidate);
        if (reachable) {
            return res.redirect(candidate);
        }
    }

    throw new AppError(404, 'Pitch PDF could not be opened');
});

const normalizeFilename = (name: string) => name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project-pitch';

const downloadPitchDoc = catchAsync(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const project = await ProjectService.getProjectPitchDocMetaFromDB(projectId);

    if (!project.pitchDocUrl) {
        throw new AppError(404, 'Pitch PDF not found for this project');
    }

    const candidates = buildPitchDocCandidates(project.pitchDocUrl);
    const publicIdCandidates = buildPitchDocPublicIdCandidates(project.pitchDocUrl);
    const preferredCandidates = [
        ...candidates.filter((candidate) => candidate.includes('/raw/upload/')),
        ...candidates.filter((candidate) => !candidate.includes('/raw/upload/')),
    ];

    const filename = `${normalizeFilename(project.title)}-pitch.pdf`;

    // Preferred path: use Cloudinary private download URL (works for restricted raw files).
    for (const publicId of publicIdCandidates) {
        try {
            const normalizedPublicId = publicId.toLowerCase().endsWith('.pdf')
                ? publicId
                : `${publicId}.pdf`;

            const privateDownloadUrl = cloudinaryInstance.utils.private_download_url(
                normalizedPublicId,
                'pdf',
                {
                    resource_type: 'raw',
                    type: 'upload',
                    attachment: true,
                    expires_at: Math.floor(Date.now() / 1000) + 300,
                }
            );

            const response = await fetch(privateDownloadUrl);
            if (!response.ok) {
                continue;
            }

            const data = Buffer.from(await response.arrayBuffer());
            if (!data.length) {
                continue;
            }

            const signature = data.subarray(0, 4).toString('ascii');
            if (signature !== '%PDF') {
                continue;
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.status(200).send(data);
        } catch {
            // Try next public_id candidate.
        }
    }

    for (const candidate of preferredCandidates) {
        try {
            const response = await fetch(candidate);
            if (!response.ok) {
                continue;
            }

            const data = Buffer.from(await response.arrayBuffer());
            if (!data.length) {
                continue;
            }

            // Ensure we only serve an actual PDF file.
            const signature = data.subarray(0, 4).toString('ascii');
            if (signature !== '%PDF') {
                continue;
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.status(200).send(data);
        } catch {
            // Try the next candidate URL.
        }
    }

    throw new AppError(404, 'Pitch PDF could not be downloaded');
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
    const projectId = req.params.id;
    const userId = req.user?.id as string;

    // 1. Fetch the existing project to get the old URLs
    const existingProject = await ProjectService.getSingleProjectFromDB(projectId as string);

    if (existingProject.status !== 'DRAFT') {
        throw new AppError(400, 'Only draft projects can be edited or submitted for review');
    }

    let newPitchDocUrl = existingProject.pitchDocUrl;
    const newImageUrls = [...existingProject.images]; // Keep existing images by default

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 2. Handle new PDF Upload
    if (files && files.pitchDoc && files.pitchDoc.length > 0) {
        // Delete the old one from Cloudinary if it exists
        if (existingProject.pitchDocUrl) {
            const publicId = extractCloudinaryPublicId(existingProject.pitchDocUrl, 'raw');
            if (publicId) await deleteFromCloudinary(publicId, 'raw');
        }
        // Upload the new one
        const file = files.pitchDoc[0];
        assertValidPdfFile(file);
        const docUpload = await uploadToCloudinary(file.buffer, 'pitch-docs', 'raw', file.originalname);
        newPitchDocUrl = docUpload.secure_url;
    }

    // 3. Handle new Image Uploads (Assuming a total replacement for simplicity)
    if (files && files.images && files.images.length > 0) {
        // Delete all old images from Cloudinary
        for (const oldImageUrl of existingProject.images) {
            const publicId = extractCloudinaryPublicId(oldImageUrl, 'image');
            if (publicId) await deleteFromCloudinary(publicId, 'image');
        }
        // Clear the array and upload the new ones
        newImageUrls.length = 0;
        for (const file of files.images) {
            const imageUpload = await uploadToCloudinary(file.buffer, 'prototypes', 'image');
            newImageUrls.push(imageUpload.secure_url);
        }
    }

    // 4. Combine data and update DB
    const updateData = {
        ...req.body,
        pitchDocUrl: newPitchDocUrl,
        images: newImageUrls,
    };

    ensureReviewReadiness(updateData.status, updateData.pitchDocUrl, updateData.images);

    const result = await ProjectService.updateProjectInDB(projectId as string, userId, updateData);

    sendResponse(res, { statusCode: 200, success: true, message: 'Project updated successfully', data: result });
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await ProjectService.deleteProjectFromDB(req.params.id as string, userId);
    sendResponse(res, { statusCode: 200, success: true, message: 'Project deleted successfully', data: result });
});

const markProjectCompleted = catchAsync(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const sponsorId = req.user?.id as string;

    const result = await ProjectService.markProjectCompletedInDB(projectId, sponsorId);

    sendResponse(res, { statusCode: 200, success: true, message: 'Project marked as completed', data: result });
});


export const ProjectController = {
    createProject,
    getAllProjects,
    getMyProjects,
    getMySingleProject,
    getSingleProject,
    redirectToPitchDoc,
    downloadPitchDoc,
    updateProject,
    deleteProject,
    markProjectCompleted
};