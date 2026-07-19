import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Building2 } from 'lucide-react';
import type { JobWithDetails } from '@/types';
import { SaveButton } from './SaveButton';
import { BACKEND_URL } from '@/lib/constants';

interface JobCardProps {
  job: JobWithDetails;
  showSaveButton?: boolean;
}

export const JobCard = memo(function JobCard({ job, showSaveButton = true }: JobCardProps) {
  const company = job.clientProfile.company;
  const companyLogo = company?.logoUrl || job.clientProfile.logoUrl;
  const companyName = company?.name || 'Company';

  return (
    <div className="bg-surface border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Company Info */}
        <div className="flex items-start gap-4 flex-1">
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

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text mb-1 line-clamp-1">{job.title}</h3>
            <p className="text-sm text-text-muted mb-3">{companyName}</p>

            <div className="flex flex-wrap gap-3 text-sm text-text-muted">
              {job.type && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.type === 'FIXED' ? 'Fixed Price' : 'Hourly'}
                </span>
              )}
              {job.budget && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ${job.budget.toLocaleString()}
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              )}
              {job.isRemote && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-medium">
                  Remote
                </span>
              )}
            </div>

            {job.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {job.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs text-text-muted"
                  >
                    {skill.name}
                  </span>
                ))}
                {job.skills.length > 4 && (
                  <span className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs text-text-muted">
                    +{job.skills.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 items-end">
          {showSaveButton && <SaveButton jobId={job.id} />}
          <Link
            to={`/jobs/${job.id}`}
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
});
