import React, { useState } from 'react';

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
    '<rect fill="#f0f0f0" width="200" height="200"/>' +
    '<text fill="#999" font-family="Arial" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Image</text>' +
    '</svg>'
  );

export function getSafeUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return PLACEHOLDER;
  const trimmed = url.trim();
  if (!trimmed) return PLACEHOLDER;
  if (trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return PLACEHOLDER;
}

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: string;
}

export function SafeImage({ src, fallback, alt, className, ...rest }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(getSafeUrl(src));

  const handleError = () => {
    setImgSrc(fallback || PLACEHOLDER);
  };

  return (
    <img
      src={imgSrc}
      alt={alt ?? ''}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
