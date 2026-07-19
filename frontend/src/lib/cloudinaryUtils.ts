const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
    '<rect fill="#f0f0f0" width="200" height="200"/>' +
    '<text fill="#999" font-family="Arial" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Image</text>' +
    '</svg>'
  );

export function getImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return PLACEHOLDER;
  const trimmed = url.trim();
  if (!trimmed) return PLACEHOLDER;
  if (trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return PLACEHOLDER;
}

interface TransformOptions {
  width?: number;
  height?: number;
  fit?: 'fill' | 'crop' | 'scale' | 'fit' | 'limit' | 'thumb';
  quality?: 'auto' | 'auto:best' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  gravity?: 'face' | 'center' | 'auto';
  radius?: number | 'max';
}

export function cloudinaryOptimize(url: string | null | undefined, options: TransformOptions = {}): string {
  const safeUrl = getImageUrl(url);
  if (!safeUrl || safeUrl === PLACEHOLDER) return PLACEHOLDER;

  if (!safeUrl.includes('res.cloudinary.com')) return safeUrl;

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

  transforms.push(`f_${format}`);
  transforms.push(`q_${quality}`);

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${fit}`);
  if (width || height) transforms.push(`g_${gravity}`);
  if (radius !== undefined) transforms.push(`r_${radius}`);

  const transformStr = transforms.join(',');

  return safeUrl.replace('/upload/', `/upload/${transformStr}/`);
}

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

export function cloudinaryPostImage(url: string | null | undefined): string {
  return cloudinaryOptimize(url, {
    width: 800,
    fit: 'limit',
    format: 'auto',
    quality: 'auto',
  });
}

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
