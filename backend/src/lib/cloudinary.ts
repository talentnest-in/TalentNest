import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { Readable } from 'stream';
import { logInfo, logWarn, logError } from './logger';

// ── Configuration ───────────────────────────────────────────────────
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = !!(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  logInfo('[Cloudinary]', 'Configured', { cloudName });
} else {
  logWarn('[Cloudinary]', 'Not configured. Uploads will fail.');
}

export { cloudinary };

// ── Upload Types ────────────────────────────────────────────────────
export type UploadResourceType = 'image' | 'video' | 'raw' | 'auto';

export interface UploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
}

// ── Folder Mapping ──────────────────────────────────────────────────
export const CLOUDINARY_FOLDERS = {
  AVATAR: 'talentnest/avatars',
  RESUME: 'talentnest/resumes',
  PORTFOLIO_IMAGE: 'talentnest/portfolio/images',
  PORTFOLIO_VIDEO: 'talentnest/portfolio/videos',
  COMPANY_LOGO: 'talentnest/company-logos',
  PROJECT_FILE: 'talentnest/project-files',
  CHAT_ATTACHMENT: 'talentnest/chat-attachments',
  COURSE_THUMBNAIL: 'talentnest/course-thumbnails',
  LESSON_VIDEO: 'talentnest/lesson-videos',
  LESSON_PDF: 'talentnest/lesson-pdfs',
  COMMUNITY_BANNER: 'talentnest/community-banners',
  COMMUNITY_LOGO: 'talentnest/community-logos',
  GENERAL: 'talentnest/general',
} as const;

// ── MIME Type Validation ────────────────────────────────────────────
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  resume: ['application/pdf'],
  portfolio_image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  portfolio_video: ['video/mp4', 'video/webm', 'video/quicktime'],
  company_logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  project_file: [
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png',
  ],
  chat_attachment: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  course_thumbnail: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  lesson_video: ['video/mp4', 'video/webm', 'video/quicktime'],
  lesson_pdf: ['application/pdf'],
  community_banner: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  community_logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  general: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
};

export const BLOCKED_EXTENSIONS = ['.exe', '.js', '.html', '.svg', '.bat', '.sh', '.php', '.py', '.rb', '.ps1', '.vbs'];

// ── Max File Sizes ──────────────────────────────────────────────────
export const FILE_SIZE_LIMITS: Record<string, number> = {
  avatar: 5 * 1024 * 1024,
  resume: 10 * 1024 * 1024,
  portfolio_image: 15 * 1024 * 1024,
  portfolio_video: 100 * 1024 * 1024,
  company_logo: 5 * 1024 * 1024,
  project_file: 50 * 1024 * 1024,
  chat_attachment: 20 * 1024 * 1024,
  course_thumbnail: 5 * 1024 * 1024,
  lesson_video: 200 * 1024 * 1024,
  lesson_pdf: 10 * 1024 * 1024,
  community_banner: 5 * 1024 * 1024,
  community_logo: 5 * 1024 * 1024,
  general: 20 * 1024 * 1024,
};

// ── Resource Type Detection ─────────────────────────────────────────
function detectResourceType(mimeType: string): UploadResourceType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || mimeType.startsWith('application/')) return 'raw';
  return 'auto';
}

function getFolderForType(uploadType: string): string {
  return (CLOUDINARY_FOLDERS as any)[uploadType] || 'talentnest/general';
}

// ── Upload Helper ───────────────────────────────────────────────────
async function performUpload(
  bufferOrStream: Buffer | Readable,
  folder: string,
  resourceType: UploadResourceType,
  filename: string,
  mimeType: string,
  isStream: boolean,
): Promise<UploadResult> {
  const publicId = filename.split('.')[0] || crypto.randomUUID();
  const isVideo = resourceType === 'video';

  const uploadOptions: any = {
    folder,
    resource_type: resourceType,
    public_id: publicId,
    type: 'upload',
  };

  // Image optimization
  if (resourceType === 'image') {
    uploadOptions.eager = [
      { quality: 'auto', fetch_format: 'auto' },
      { quality: 'auto', fetch_format: 'auto', width: 800, crop: 'limit' },
    ];
    uploadOptions.eager_async = true;
    uploadOptions.image_metadata = true;
  }

  // Video optimization
  if (isVideo) {
    uploadOptions.eager = [
      { streaming_profile: 'full_hd', quality: 'auto' },
    ];
    uploadOptions.eager_async = true;
    uploadOptions.chunk_size = 6000000;
  }

  if (isStream) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id!,
              resource_type: result.resource_type,
              bytes: result.bytes,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          } else {
            reject(new Error('Upload failed: no result'));
          }
        }
      );
      (bufferOrStream as Readable).pipe(uploadStream);
      (bufferOrStream as Readable).on('error', reject);
    });
  }

  const buffer = bufferOrStream as Buffer;
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id!,
            resource_type: result.resource_type,
            bytes: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('Upload failed: no result'));
        }
      })
      .end(buffer);
  });
}

// ── Public Upload API ───────────────────────────────────────────────

// ── Backward-compatible aliases ─────────────────────────────────────
export const uploadToCloudinary = uploadFile;
export const uploadVideoToCloudinary = uploadVideo;

export async function uploadFile(
  file: Buffer | Readable,
  filename: string,
  mimeType: string,
  uploadType: string,
): Promise<UploadResult> {
  const folder = getFolderForType(uploadType);
  const resourceType = detectResourceType(mimeType);
  const isStream = file instanceof Readable && !Buffer.isBuffer(file);
  return performUpload(file, folder, resourceType, filename, mimeType, isStream);
}

export async function uploadImage(
  file: Buffer | Readable,
  filename: string,
  mimeType: string,
  folder: string,
): Promise<UploadResult> {
  return performUpload(file, folder, 'image', filename, mimeType, file instanceof Readable && !Buffer.isBuffer(file));
}

export async function uploadVideo(
  stream: Readable,
  filename: string,
  mimeType: string,
  folder: string,
): Promise<UploadResult> {
  return performUpload(stream, folder, 'video', filename, mimeType, true);
}

export async function uploadRaw(
  file: Buffer,
  filename: string,
  mimeType: string,
  folder: string,
): Promise<UploadResult> {
  return performUpload(file, folder, 'raw', filename, mimeType, false);
}

// ── Delete ──────────────────────────────────────────────────────────

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  return new Promise((resolve) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        logWarn('[Cloudinary]', `Delete failed for ${publicId}`, { message: error.message });
        resolve(false);
      } else {
        resolve(result?.result === 'ok');
      }
    });
  });
}

export async function deleteResources(publicIds: string[]): Promise<number> {
  if (publicIds.length === 0) return 0;
  let deleted = 0;
  for (const id of publicIds) {
    const ok = await deleteFromCloudinary(id);
    if (ok) deleted++;
  }
  return deleted;
}

// ── Replace: delete old then upload new ─────────────────────────────

export async function replaceFile(
  oldPublicId: string | null | undefined,
  file: Buffer | Readable,
  filename: string,
  mimeType: string,
  uploadType: string,
): Promise<UploadResult> {
  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId).catch(() => {});
  }
  return uploadFile(file, filename, mimeType, uploadType);
}

// ── Signed Upload URL (for client-side uploads) ─────────────────────

export function generateSignedUploadUrl(
  folder: string,
  uploadType: string,
  opts?: { maxSize?: number; allowedFormats?: string[] },
): { signature: string; timestamp: number; publicId: string; cloudName: string; apiKey: string; folder: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = crypto.randomUUID();

  const params: Record<string, any> = {
    timestamp,
    folder,
    public_id: publicId,
    type: 'upload',
  };

  if (opts?.maxSize) params.max_file_size = opts.maxSize;
  if (opts?.allowedFormats) params.allowed_formats = opts.allowedFormats.join(',');

  // Image optimization params
  if (uploadType.startsWith('image') || uploadType === 'avatar' || uploadType === 'company_logo' || uploadType === 'course_thumbnail') {
    params.eager = 'q_auto,f_auto';
    params.eager_async = true;
  }

  const signature = cloudinary.utils.api_sign_request(params, apiSecret!);

  return {
    signature,
    timestamp,
    publicId,
    cloudName: cloudName!,
    apiKey: apiKey!,
    folder,
  };
}

// ── Image URL Transformation ────────────────────────────────────────

export function getOptimizedImageUrl(publicId: string, opts?: { width?: number; height?: number; quality?: string; fetchFormat?: string }): string {
  const transformations: string[] = [];
  if (opts?.quality) transformations.push(`q_${opts.quality}`);
  else transformations.push('q_auto');
  if (opts?.fetchFormat) transformations.push(`f_${opts.fetchFormat}`);
  else transformations.push('f_auto');
  if (opts?.width) transformations.push(`w_${opts.width}`);
  if (opts?.height) transformations.push(`h_${opts.height}`);
  return cloudinary.url(publicId, {
    transformation: transformations.join(','),
    secure: true,
  });
}

// ── Validate File ───────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  mimeType: string | undefined,
  filename: string,
  fileSize: number,
  uploadType: string,
): FileValidationResult {
  if (!mimeType) {
    return { valid: false, error: 'No MIME type detected' };
  }

  const allowedMimes = ALLOWED_MIME_TYPES[uploadType];
  if (allowedMimes && !allowedMimes.includes(mimeType)) {
    return { valid: false, error: `Invalid file type for ${uploadType}. Allowed: ${allowedMimes.join(', ')}` };
  }

  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext as string)) {
    return { valid: false, error: `File type ${ext} is not allowed` };
  }

  const maxSize = FILE_SIZE_LIMITS[uploadType] || 20 * 1024 * 1024;
  if (fileSize > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  return { valid: true };
}

// ── Orphan Detection ────────────────────────────────────────────────

export async function deleteOrphanAssets(
  knownPublicIds: Set<string>,
  prefix: string = 'talentnest/',
): Promise<number> {
  let deletedCount = 0;
  let nextCursor: string | undefined;

  try {
    do {
      const result: any = await cloudinary.api.resources({
        type: 'upload',
        prefix,
        max_results: 500,
        next_cursor: nextCursor,
      });

      for (const resource of result.resources) {
        if (!knownPublicIds.has(resource.public_id)) {
          await deleteFromCloudinary(resource.public_id);
          deletedCount++;
        }
      }

      nextCursor = result.next_cursor;
    } while (nextCursor);

    return deletedCount;
  } catch (error) {
    logError('[Cloudinary]', error, { context: 'orphan_cleanup' });
    return deletedCount;
  }
}
