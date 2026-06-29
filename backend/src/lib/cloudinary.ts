import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

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

// Upload file to Cloudinary
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
