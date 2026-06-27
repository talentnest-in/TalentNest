# Known Bugs & Technical Debt

## Current Bugs
- None actively reported blocking core workflows.

## Technical Debt / Limitations
- File uploads are stored locally (`public/uploads`). In a multi-instance production environment, this will cause missing files. **Needs migration to AWS S3 / Cloudinary.**
- No pagination on job listings yet.

## Temporary Workarounds
- Fastify static serving is used for images.
