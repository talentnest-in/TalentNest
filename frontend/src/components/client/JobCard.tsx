import { MapPin, DollarSign, Briefcase, Clock, Users } from 'lucide-react';
import type { Job } from '@/types';
import { JobStatusBadge } from './JobStatusBadge';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface JobCardProps {
  job: Job;
  onDelete?: (id: string) => void;
}

export function JobCard({ job, onDelete }: JobCardProps) {
  const navigate = useNavigate();
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="bg-surface border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text text-lg leading-snug line-clamp-1">{job.title}</h3>
          <p className="text-sm text-text-muted mt-1 line-clamp-2">{job.description}</p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-text-muted">
        <span className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4" />
          {job.type === 'FIXED' ? 'Fixed Price' : 'Hourly'}
        </span>
        {job.budget && (
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            {job.budget.toLocaleString()}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {job.isRemote ? 'Remote' : job.location ?? 'On-site'}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {timeAgo(job.createdAt)}
        </span>
      </div>

      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((s) => (
            <span key={s.id} className="px-2.5 py-0.5 text-xs font-medium bg-background border border-border rounded-full text-text-muted">
              {s.name}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className="px-2.5 py-0.5 text-xs font-medium text-text-muted">+{job.skills.length - 5} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-border">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/jobs/${job.id}/edit`)}>
          Edit
        </Button>
        <Button size="sm" variant="accent" className="flex-1 gap-2" onClick={() => navigate(`/client/jobs/${job.id}/applicants`)}>
          <Users className="w-4 h-4" />
          View Applicants
        </Button>
        {onDelete && (
          <Button size="sm" variant="ghost" className="text-error hover:bg-error/10" onClick={() => onDelete(job.id)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
