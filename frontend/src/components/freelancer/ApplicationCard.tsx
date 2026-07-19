import { Link } from 'react-router-dom';
import { Clock, DollarSign, MapPin, Building2 } from 'lucide-react';
import type { JobApplication } from '@/types';
import { ApplicationStatusBadge } from '@/components/shared/ApplicationStatusBadge';
import { BACKEND_URL } from '@/lib/constants';

interface ApplicationCardProps {
  application: JobApplication;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const job = application.job;
  const company = job?.clientProfile?.company;
  const companyLogo = company?.logoUrl || job?.clientProfile?.logoUrl;
  const companyName = company?.name || 'Company';

  const appliedDate = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {companyLogo ? (
            <img
              src={companyLogo?.startsWith('http') ? companyLogo : `${BACKEND_URL}${companyLogo}`}
              alt={companyName}
              className="w-12 h-12 rounded-xl object-cover border border-border"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <Link
              to={`/jobs/${job?.id}`}
              className="font-semibold text-text hover:text-accent transition-colors"
            >
              {job?.title}
            </Link>
            <p className="text-sm text-text-muted">{companyName}</p>
          </div>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-4">
        {job?.budget && (
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            ${job.budget.toLocaleString()}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {job?.isRemote ? 'Remote' : job?.location || 'On-site'}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          Applied {appliedDate}
        </span>
      </div>

      {application.proposedRate && (
        <div className="text-sm text-text-muted mb-4">
          <span className="font-medium text-text">Proposed Rate:</span> ${application.proposedRate.toLocaleString()}/hr
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-sm text-text-muted line-clamp-1">
          {application.coverLetter}
        </p>
        <Link
          to={`/applications/${application.id}`}
          className="text-sm text-accent hover:text-accent/80 font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
