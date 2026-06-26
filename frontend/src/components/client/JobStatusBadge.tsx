import type { JobStatus } from '@/types';

const config: Record<JobStatus, { label: string; classes: string }> = {
  DRAFT:  { label: 'Draft',  classes: 'bg-border/60 text-text-muted' },
  OPEN:   { label: 'Open',   classes: 'bg-success/15 text-success' },
  PAUSED: { label: 'Paused', classes: 'bg-warning/15 text-warning' },
  CLOSED: { label: 'Closed', classes: 'bg-error/15 text-error' },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, classes } = config[status] ?? config.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
