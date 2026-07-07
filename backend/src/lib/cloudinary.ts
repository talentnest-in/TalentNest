import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { Readable } from 'stream';

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log('Cloudinary configured successfully with cloud name:', cloudName);
} else {
  console.warn('Cloudinary credentials not configured. File uploads will fail.');
  console.warn('Missing:', {
    cloudName: !!cloudName,
    apiKey: !!apiKey,
    apiSecret: !!apiSecret,
  });
}

export { cloudinary };

// Upload file to Cloudinary (buffer-based for small files)
export async function uploadToCloudinary(
  file: Buffer,
  filename: string,
  mimeType: string,
  folder: string
): Promise<{
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
  format: string;
}> {
  // Determine resource type based on MIME type
  const resourceType: 'auto' | 'image' | 'raw' = mimeType.startsWith('image/') ? 'image' : (
    mimeType === 'application/pdf' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/zip' ||
    mimeType === 'application/x-zip-compressed'
  ) ? 'raw' : 'auto';

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: filename.split('.')[0] || crypto.randomUUID(),
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'zip'],
          max_file_size: 20 * 1024 * 1024, // 20MB
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              resource_type: result.resource_type,
              bytes: result.bytes,
              format: result.format,
            });
          } else {
            reject(new Error('Cloudinary upload failed: No result returned'));
          }
        }
      )
      .end(file);
  });
}

// Upload video to Cloudinary (stream-based for large files to avoid memory issues)
export async function uploadVideoToCloudinary(
  stream: Readable,
  filename: string,
  mimeType: string,
  folder: string
): Promise<{
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
  format: string;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        public_id: filename.split('.')[0] || crypto.randomUUID(),
        allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
        max_file_size: 100 * 1024 * 1024, // 100MB
        chunk_size: 6000000, // 6MB chunks for better streaming
        eager: [{ streaming_profile: 'full_hd' }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            bytes: result.bytes,
            format: result.format,
          });
        } else {
          reject(new Error('Cloudinary video upload failed: No result returned'));
        }
      }
    );

    stream.pipe(uploadStream);

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
