import { MultipartFile } from '@fastify/multipart';
import crypto from 'crypto';
import {
  uploadFile as cloudinaryUploadFile,
  replaceFile,
  validateFile,
  UploadResult,
} from './cloudinary';

export type UploadType =
  | 'avatar'
  | 'logo'
  | 'portfolio'
  | 'portfolio_image'
  | 'portfolio_video'
  | 'resume'
  | 'project_file'
  | 'chat_attachment'
  | 'course_thumbnail'
  | 'lesson_video';

const UPLOAD_TYPE_MAP: Record<string, string> = {
  avatar: 'avatar',
  logo: 'company_logo',
  portfolio: 'portfolio_image',
  portfolio_image: 'portfolio_image',
  portfolio_video: 'portfolio_video',
  resume: 'resume',
  project_file: 'project_file',
  chat_attachment: 'chat_attachment',
  course_thumbnail: 'course_thumbnail',
  lesson_video: 'lesson_video',
};

export interface UploadInput {
  file: MultipartFile;
  type: UploadType;
  oldPublicId?: string | null;
}

export interface UploadOutput {
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
  format: string;
}

export async function uploadFile(input: UploadInput): Promise<UploadOutput> {
  const { file, type, oldPublicId } = input;
  const mimeType = file.mimetype;
  const fileSize = file.file.bytesRead;
  const ext = '.' + (file.filename.split('.').pop()?.toLowerCase() || 'bin');
  const randomName = crypto.randomBytes(16).toString('hex');
  const filename = `${randomName}${ext}`;
  const uploadType = UPLOAD_TYPE_MAP[type] || 'general';

  // Validate
  const validation = validateFile(mimeType, filename, fileSize, uploadType);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = await file.toBuffer();

  let result: UploadResult;
  if (oldPublicId) {
    result = await replaceFile(oldPublicId, buffer, filename, mimeType, uploadType);
  } else {
    result = await cloudinaryUploadFile(buffer, filename, mimeType, uploadType);
  }

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
    bytes: result.bytes,
    format: result.format,
  };
}
