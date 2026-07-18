import { extname } from 'path';
import { randomUUID } from 'crypto';

// ── Allowed Extensions (in addition to MIME checks) ──────────────────
export const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  avatar: ['.jpg', '.jpeg', '.png', '.webp'],
  resume: ['.pdf'],
  portfolio_image: ['.jpg', '.jpeg', '.png', '.webp'],
  portfolio_video: ['.mp4', '.webm', '.mov'],
  company_logo: ['.jpg', '.jpeg', '.png', '.webp'],
  project_file: ['.pdf', '.doc', '.docx', '.zip', '.rar'],
  chat_attachment: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.zip', '.txt'],
  course_thumbnail: ['.jpg', '.jpeg', '.png', '.webp'],
  lesson_video: ['.mp4', '.webm', '.mov'],
  lesson_pdf: ['.pdf'],
  community_banner: ['.jpg', '.jpeg', '.png', '.webp'],
  community_logo: ['.jpg', '.jpeg', '.png', '.webp'],
  general: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4'],
};

// ── Blocked Extensions (always reject) ───────────────────────────────
export const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.sh', '.bash', '.dll', '.sys', '.ps1', '.vbs', '.js',
  '.jar', '.war', '.php', '.asp', '.aspx', '.jsp', '.py',
  '.rb', '.pl', '.cgi', '.htaccess', '.env',
];

// ─── Dangerous Content Patterns ──────────────────────────────────────
export const DANGEROUS_CONTENT_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*['"]/i,
  /data:\s*text\/html/i,
  /<!--.*-->/,  // HTML comments
  /\0/,         // Null bytes
  /\.\.\//,     // Path traversal
  /~\$/,         // Windows alternate data streams
];

// ── Size Limits (in bytes) ──────────────────────────────────────────
export const SIZE_LIMITS: Record<string, number> = {
  avatar: 2 * 1024 * 1024,           // 2 MB
  resume: 10 * 1024 * 1024,          // 10 MB
  portfolio_image: 5 * 1024 * 1024,  // 5 MB
  portfolio_video: 200 * 1024 * 1024, // 200 MB
  company_logo: 2 * 1024 * 1024,     // 2 MB
  project_file: 50 * 1024 * 1024,    // 50 MB
  chat_attachment: 25 * 1024 * 1024, // 25 MB
  course_thumbnail: 5 * 1024 * 1024, // 5 MB
  lesson_video: 500 * 1024 * 1024,   // 500 MB
  lesson_pdf: 50 * 1024 * 1024,      // 50 MB
  community_banner: 5 * 1024 * 1024, // 5 MB
  community_logo: 2 * 1024 * 1024,   // 2 MB
  general: 100 * 1024 * 1024,        // 100 MB
};

export const DEFAULT_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

// ── Validation Functions ────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileExtension(filename: string, uploadType: string): FileValidationResult {
  const ext = extname(filename).toLowerCase();

  // Check blocked extensions first
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File extension "${ext}" is not allowed` };
  }

  // Check allowed extensions for this type
  const allowed = ALLOWED_EXTENSIONS[uploadType];
  if (allowed && !allowed.includes(ext)) {
    return { valid: false, error: `File extension "${ext}" not allowed for ${uploadType}. Allowed: ${allowed.join(', ')}` };
  }

  return { valid: true };
}

export function validateFileSize(size: number, uploadType: string): FileValidationResult {
  const limit = SIZE_LIMITS[uploadType] || DEFAULT_SIZE_LIMIT;
  if (size > limit) {
    const limitMB = Math.round(limit / (1024 * 1024));
    return { valid: false, error: `File size exceeds ${limitMB}MB limit for ${uploadType}` };
  }
  return { valid: true };
}

export function validateFileName(name: string): FileValidationResult {
  if (!name || name.length > 255) {
    return { valid: false, error: 'Filename must be between 1 and 255 characters' };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_CONTENT_PATTERNS) {
    if (pattern.test(name)) {
      return { valid: false, error: 'Filename contains unsafe content' };
    }
  }

  // Only allow safe characters
  if (!/^[\w\-. ()[\]{}[\]@,!~'+=;&# ]+$/.test(name)) {
    return { valid: false, error: 'Filename contains invalid characters' };
  }

  return { valid: true };
}

export function generateSafeFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  const safeName = randomUUID();
  return `${safeName}${ext}`;
}

export function validateUpload(filename: string, mimeType: string, size: number, uploadType: string): FileValidationResult {
  // Validate extension
  const extResult = validateFileExtension(filename, uploadType);
  if (!extResult.valid) return extResult;

  // Validate filename
  const nameResult = validateFileName(filename);
  if (!nameResult.valid) return nameResult;

  // Validate size
  const sizeResult = validateFileSize(size, uploadType);
  if (!sizeResult.valid) return sizeResult;

  return { valid: true };
}
