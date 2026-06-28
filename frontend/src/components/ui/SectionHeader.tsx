import { type ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-semibold text-primary">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
