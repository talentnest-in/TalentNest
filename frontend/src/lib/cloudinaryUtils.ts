/**
 * Cloudinary image optimization helper.
 * Transforms raw Cloudinary URLs to use auto-format, quality, and size optimizations
 * for dramatically faster image loading (WebP auto-conversion, right-sized thumbnails).
 *
 * Usage:
 *   cloudinaryOptimize(url, { width: 96, height: 96, fit: 'fill' })
 *   cloudinaryAvatar(url)
 *   cloudinaryBanner(url)
 */

interface TransformOptions {
  width?: number;
  height?: number;
  fit?: 'fill' | 'crop' | 'scale' | 'fit' | 'limit' | 'thumb';
  quality?: 'auto' | 'auto:best' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  gravity?: 'face' | 'center' | 'auto';
  radius?: number | 'max';
}

/**
 * Returns a Cloudinary URL with transformation params applied.
 * Only modifies Cloudinary URLs — passes through other URLs unchanged.
 */
export function cloudinaryOptimize(url: string | null | undefined, options: TransformOptions = {}): string {
  if (!url) return '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) return url;

  const {
    width,
    height,
    fit = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'auto',
    radius,
  } = options;

  const transforms: string[] = [];

  // Core transforms
  transforms.push(`f_${format}`);
  transforms.push(`q_${quality}`);

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${fit}`);
  if (width || height) transforms.push(`g_${gravity}`);
  if (radius !== undefined) transforms.push(`r_${radius}`);

  const transformStr = transforms.join(',');

  // Insert transforms after the /upload/ segment
  return url.replace('/upload/', `/upload/${transformStr}/`);
}

// ── Preset helpers ───────────────────────────────────────────────────────────

/** Optimized avatar: 96×96, circular crop, WebP */
export function cloudinaryAvatar(url: string | null | undefined, size = 96): string {
  return cloudinaryOptimize(url, {
    width: size,
    height: size,
    fit: 'fill',
    gravity: 'face',
    format: 'auto',
    quality: 'auto',
  });
}

/** Optimized community/profile banner: 1200×400 */
export function cloudinaryBanner(url: string | null | undefined): string {
  return cloudinaryOptimize(url, {
    width: 1200,
    height: 400,
    fit: 'fill',
    gravity: 'center',
    format: 'auto',
    quality: 'auto',
  });
}

/** Optimized community logo: square thumbnail */
export function cloudinaryLogo(url: string | null | undefined, size = 128): string {
  return cloudinaryOptimize(url, {
    width: size,
    height: size,
    fit: 'fill',
    gravity: 'center',
    format: 'auto',
    quality: 'auto',
  });
}

/** Optimized post image: full-width, max 800px wide */
export function cloudinaryPostImage(url: string | null | undefined): string {
  return cloudinaryOptimize(url, {
    width: 800,
    fit: 'limit',
    format: 'auto',
    quality: 'auto',
  });
}

/** Optimized course thumbnail: 640×360 (16:9) */
export function cloudinaryCourseThumbnail(url: string | null | undefined): string {
  return cloudinaryOptimize(url, {
    width: 640,
    height: 360,
    fit: 'fill',
    gravity: 'center',
    format: 'auto',
    quality: 'auto',
  });
}
