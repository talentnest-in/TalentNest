import { MultipartFile } from '@fastify/multipart';
import path from 'path';
import crypto from 'crypto';
import { uploadToCloudinary } from './cloudinary';

export type UploadType = 'avatar' | 'logo' | 'portfolio' | 'resume';

const ALLOWED_MIME_TYPES: Record<UploadType, string[]> = {
  avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  portfolio: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  resume: ['application/pdf'],
};

const ALLOWED_EXTENSIONS: Record<UploadType, string[]> = {
  avatar: ['.jpg', '.jpeg', '.png', '.webp'],
  logo: ['.jpg', '.jpeg', '.png', '.webp'],
  portfolio: ['.jpg', '.jpeg', '.png', '.webp'],
  resume: ['.pdf'],
};

const BLOCKED_EXTENSIONS = ['.exe', '.js', '.html', '.svg', '.zip', '.bat', '.sh', '.php', '.py', '.rb'];

const FILE_SIZE_LIMITS: Record<UploadType, number> = {
  avatar: 5 * 1024 * 1024, // 5MB
  logo: 5 * 1024 * 1024, // 5MB
  portfolio: 10 * 1024 * 1024, // 10MB
  resume: 10 * 1024 * 1024, // 10MB
};

const CLOUDINARY_FOLDERS: Record<UploadType, string> = {
  avatar: 'talentnest/avatars',
  logo: 'talentnest/company-logos',
  portfolio: 'talentnest/portfolio',
  resume: 'talentnest/resumes',
};

export interface UploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
  format: string;
}

export async function uploadFile(file: MultipartFile, type: UploadType): Promise<UploadResult> {
  // Check file size
  const fileSize = file.file.bytesRead;
  const maxSize = FILE_SIZE_LIMITS[type];
  
  if (fileSize > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }

  // Validate MIME type
  const mimeType = file.mimetype;
  if (!mimeType || !ALLOWED_MIME_TYPES[type].includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES[type].join(', ')}`);
  }

  // Validate extension
  const ext = path.extname(file.filename).toLowerCase();
  
  // Check for blocked extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    throw new Error(`File type ${ext} is not allowed`);
  }

  if (!ALLOWED_EXTENSIONS[type].includes(ext)) {
    throw new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS[type].join(', ')}`);
  }

  // Convert file to buffer
  const buffer = await file.toBuffer();
  
  // Generate unique filename
  const randomName = crypto.randomBytes(16).toString('hex');
  const filename = `${randomName}${ext}`;
  
  // Upload to Cloudinary
  const folder = CLOUDINARY_FOLDERS[type];
  const result = await uploadToCloudinary(buffer, filename, mimeType, folder);
  
  return result;
}
