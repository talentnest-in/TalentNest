import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  lines?: number;
}

/**
 * Shimmer skeleton loading component.
 * Used as a content placeholder while data is being fetched.
 *
 * Usage:
 *   <Skeleton width="100%" height={20} />
 *   <Skeleton lines={3} />
 *   <Skeleton width={48} height={48} rounded="full" />  // Avatar
 */
export function Skeleton({ width, height, rounded = 'lg', lines, className = '', ...props }: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const baseClass = `bg-border/70 animate-pulse ${roundedMap[rounded]} ${className}`;

  if (lines && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={baseClass}
            style={{
              height: typeof height === 'number' ? `${height}px` : height || '16px',
              width: i === lines - 1 ? '70%' : '100%', // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={baseClass}
      style={skeletonStyle}
      {...props}
    />
  );
}

/** Pre-built skeleton for a post card */
export function PostCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" height={14} />
          <Skeleton width="25%" height={12} />
        </div>
      </div>
      <Skeleton lines={3} height={14} />
      <div className="flex gap-4 pt-1">
        <Skeleton width={60} height={32} rounded="xl" />
        <Skeleton width={60} height={32} rounded="xl" />
        <Skeleton width={60} height={32} rounded="xl" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for a community card */
export function CommunityCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <Skeleton width="100%" height={100} rounded="sm" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton width={48} height={48} rounded="xl" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
        <Skeleton lines={2} height={12} />
        <Skeleton width="80%" height={32} rounded="xl" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for a job card */
export function JobCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={14} />
        </div>
        <Skeleton width={80} height={28} rounded="full" />
      </div>
      <Skeleton lines={2} height={13} />
      <div className="flex gap-2">
        <Skeleton width={70} height={28} rounded="full" />
        <Skeleton width={70} height={28} rounded="full" />
        <Skeleton width={70} height={28} rounded="full" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton width={100} height={13} />
        <Skeleton width={90} height={34} rounded="xl" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for a stat card */
export function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width={100} height={14} />
        <Skeleton width={40} height={40} rounded="xl" />
      </div>
      <Skeleton width={80} height={32} />
      <Skeleton width={120} height={12} />
    </div>
  );
}

/** Pre-built skeleton for a member row */
export function MemberRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="full" />
        <div className="space-y-1">
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <Skeleton width={70} height={28} rounded="full" />
    </div>
  );
}
