import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Illustrated empty state component.
 * Used to replace blank areas when there's no data to display.
 *
 * Usage:
 *   <EmptyState
 *     icon={<EmptyPostsIcon />}
 *     title="No posts yet"
 *     description="Be the first to start a conversation!"
 *     action={<Button>Create Post</Button>}
 *   />
 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      {icon && (
        <div className="mb-6 text-text-muted/40">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

// ── SVG Icon Illustrations ────────────────────────────────────────────────────

export function EmptyPostsIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="20" width="80" height="60" rx="12" stroke="currentColor" strokeWidth="4" fill="none" />
      <line x1="25" y1="40" x2="75" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="25" y1="52" x2="65" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="25" y1="64" x2="55" y2="64" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="22" r="10" fill="currentColor" opacity="0.15" />
      <path d="M74 22h8M78 18v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyJobsIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="30" width="70" height="50" rx="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path d="M35 30V25a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="30" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="62" x2="60" y2="62" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function EmptyApplicationsIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="15" width="60" height="70" rx="8" stroke="currentColor" strokeWidth="4" fill="none" />
      <line x1="33" y1="35" x2="67" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="33" y1="47" x2="67" y2="47" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="33" y1="59" x2="55" y2="59" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="33" cy="35" r="3" fill="currentColor" />
      <circle cx="33" cy="47" r="3" fill="currentColor" />
      <circle cx="33" cy="59" r="3" fill="currentColor" />
    </svg>
  );
}

export function EmptyMembersIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="35" r="15" stroke="currentColor" strokeWidth="4" fill="none" />
      <path d="M20 80c0-16.6 13.4-30 30-30s30 13.4 30 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="78" cy="28" r="8" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M68 55c2.8-1.3 5.8-2 9-2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function EmptyCommunitiesIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="40" r="14" stroke="currentColor" strokeWidth="4" fill="none" />
      <circle cx="70" cy="40" r="14" stroke="currentColor" strokeWidth="4" fill="none" />
      <circle cx="50" cy="65" r="14" stroke="currentColor" strokeWidth="4" fill="none" />
      <line x1="40" y1="47" x2="44" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="60" y1="47" x2="56" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function EmptyNotificationsIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15C50 15 28 25 28 55v15h44V55C72 25 50 15 50 15Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" fill="none" />
      <path d="M44 70a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="3" fill="none" />
      <line x1="50" y1="10" x2="50" y2="15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M35 26 L25 16M65 26 L75 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function EmptySearchIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="42" cy="42" r="24" stroke="currentColor" strokeWidth="4" fill="none" />
      <line x1="59" y1="59" x2="80" y2="80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="33" y1="42" x2="51" y2="42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="42" y1="33" x2="42" y2="51" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyContractsIcon() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="12" width="64" height="76" rx="8" stroke="currentColor" strokeWidth="4" fill="none" />
      <line x1="32" y1="35" x2="68" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="47" x2="68" y2="47" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 62l8 8 18-18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
