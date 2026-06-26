import { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

export async function uploadFile(file: MultipartFile): Promise<string> {
  const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(file.filename);
  const randomName = crypto.randomBytes(16).toString('hex') + ext;
  const filePath = path.join(uploadsDir, randomName);
  
  await pipeline(file.file, fs.createWriteStream(filePath));
  
  return `/public/uploads/${randomName}`;
}
