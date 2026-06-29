import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';

// Allowed file types and MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function uploadRoutes(fastify: FastifyInstance) {
  // Upload file for chat
  fastify.post('/', {
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
            error: 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOCX, ZIP' 
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
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const uniqueFileName = `${randomUUID()}${fileExtension}`;
        const uploadPath = path.join(uploadDir, uniqueFileName);

        // Ensure uploads directory exists
        await mkdir(uploadDir, { recursive: true });

        // Save file
        await writeFile(uploadPath, buffer);

        // Return file URL
        const fileUrl = `/public/uploads/${uniqueFileName}`;

        return reply.send({
          fileName: data.filename,
          fileUrl,
          mimeType: data.mimetype,
          size: buffer.length,
        });
      } catch (error) {
        request.log.error(error, 'File upload failed');
        return reply.status(500).send({ error: 'Failed to upload file' });
      }
    },
  });
}
