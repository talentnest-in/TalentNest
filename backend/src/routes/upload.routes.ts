import { FastifyInstance } from 'fastify';
import { uploadToCloudinary } from '../lib/cloudinary';
import path from 'path';
import crypto from 'crypto';

// Allowed file types and MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/zip',
  'application/x-zip-compressed',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function uploadRoutes(fastify: FastifyInstance) {
  // Upload file for chat
  fastify.post('/upload', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const data = await request.file();
        
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate MIME type first (before reading buffer)
        if (!data.mimetype || !ALLOWED_MIME_TYPES.includes(data.mimetype)) {
          return reply.status(400).send({ 
            error: 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, ZIP' 
          });
        }

        // Read buffer first — bytesRead is only populated after this
        const buffer = await data.toBuffer();

        // Validate file size AFTER reading buffer
        if (buffer.length > MAX_FILE_SIZE) {
          return reply.status(400).send({ error: 'File size exceeds 20MB limit' });
        }

        // Generate unique filename
        const fileExtension = path.extname(data.filename);
        const randomName = crypto.randomBytes(16).toString('hex');
        const filename = `${randomName}${fileExtension}`;
        
        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, filename, data.mimetype, 'talentnest/chat-attachments');

        return reply.send({
          fileName: data.filename,
          fileUrl: result.secure_url,
          publicId: result.public_id,
          mimeType: data.mimetype,
          size: result.bytes,
        });
      } catch (error) {
        request.log.error(error, 'File upload failed');
        console.error('Upload error details:', error);
        return reply.status(500).send({ error: 'Failed to upload file', details: error instanceof Error ? error.message : String(error) });
      }
    },
  });

  // Download file with correct filename
  fastify.get('/download', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { url, fileName } = request.query as { url: string; fileName: string };
        
        if (!url || !fileName) {
          return reply.status(400).send({ error: 'Missing url or fileName parameter' });
        }

        // Fetch the file from Cloudinary
        const response = await fetch(url);
        
        if (!response.ok) {
          return reply.status(500).send({ error: 'Failed to fetch file from Cloudinary' });
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        
        // Determine Content-Type based on file extension
        const ext = path.extname(fileName).toLowerCase();
        const contentTypeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.zip': 'application/zip',
        };
        const contentType = contentTypeMap[ext] || 'application/octet-stream';
        
        // Set Content-Disposition header with original filename
        reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
        reply.header('Content-Type', contentType);
        
        return reply.send(buffer);
      } catch (error) {
        request.log.error(error, 'File download failed');
        return reply.status(500).send({ error: 'Failed to download file' });
      }
    },
  });
}
