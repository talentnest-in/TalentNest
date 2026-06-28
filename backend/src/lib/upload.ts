import { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

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

export async function uploadFile(file: MultipartFile, type: UploadType): Promise<string> {
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

  const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const randomName = crypto.randomBytes(16).toString('hex') + ext;
  const filePath = path.join(uploadsDir, randomName);
  
  await pipeline(file.file, fs.createWriteStream(filePath));
  
  return `/public/uploads/${randomName}`;
}
