import { Link } from 'react-router-dom';
import { Clock, DollarSign, Star, ChevronRight } from 'lucide-react';
import type { ApplicationWithDetails } from '@/types';
import { ApplicationStatusBadge } from '@/components/shared/ApplicationStatusBadge';

interface ApplicantCardProps {
  application: ApplicationWithDetails;
}

export function ApplicantCard({ application }: ApplicantCardProps) {
  const profile = application.profile;
  const user = profile.user;

  const appliedDate = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-text">{user?.name || 'Anonymous'}</h3>
            <p className="text-sm text-text-muted">{profile.title || 'Freelancer'}</p>
          </div>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-4">
        {application.proposedRate && (
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            Proposed: ${application.proposedRate.toLocaleString()}/hr
          </span>
        )}
        {profile.hourlyRate && (
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-accent" />
            Rate: ${profile.hourlyRate.toLocaleString()}/hr
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          Applied {appliedDate}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-sm text-text-muted line-clamp-1">
          {application.coverLetter}
        </p>
        <Link
          to={`/client/applicants/${application.id}`}
          className="text-sm text-accent hover:text-accent/80 font-medium flex items-center gap-1"
        >
          View Profile <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
