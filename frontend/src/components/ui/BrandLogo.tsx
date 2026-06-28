interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export function BrandLogo({ 
  size = 'medium', 
  showText = true, 
  showTagline = true,
  className = '' 
}: BrandLogoProps) {
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-12',
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
  };

  const taglineSizeClasses = {
    small: 'text-[0.4rem]',
    medium: 'text-[0.5rem]',
    large: 'text-[0.6rem]',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/ChatGPT Image Jun 26, 2026, 08_00_46 AM.png"
        alt="TalentNest Logo"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-logo font-bold ${textSizeClasses[size]} tracking-tight leading-none`}>
            <span className="text-primary">Talent</span>
            <span className="text-accent">Nest</span>
          </span>
          {showTagline && (
            <span className={`${taglineSizeClasses[size]} tracking-widest text-primary font-medium uppercase leading-none mt-1`}>
              The Independent Career Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}
