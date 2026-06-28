import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-text-muted max-w-2xl">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
