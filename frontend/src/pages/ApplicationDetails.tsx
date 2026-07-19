import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services/application.service';
import { ApplicationStatusBadge } from '@/components/shared/ApplicationStatusBadge';
import { Button } from '@/components/ui/Button';
import { DollarSign, MapPin, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '@/lib/constants';

export function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getApplicationDetails(id!),
    enabled: !!id,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => applicationService.withdrawApplication(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-border rounded w-3/4" />
            <div className="h-32 bg-border rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Application not found</p>
          <Button variant="outline" onClick={() => navigate('/applications')}>
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  const application = data.application;
  const job = application.job;
  const company = job?.clientProfile?.company;
  const companyLogo = company?.logoUrl || job?.clientProfile?.logoUrl;
  const companyName = company?.name || 'Company';

  const appliedDate = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const canWithdraw = application.status === 'PENDING' || application.status === 'REVIEWING';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/applications')}
            className="flex items-center gap-2 text-text-muted hover:text-text mb-4 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </button>
          <h1 className="text-2xl font-heading font-bold text-text mb-2">Application Details</h1>
          <div className="flex items-center gap-4">
            <ApplicationStatusBadge status={application.status} />
            <span className="text-sm text-text-muted">Applied on {appliedDate}</span>
          </div>
        </div>

        {/* Job Info */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            {companyLogo ? (
              <img
                src={companyLogo?.startsWith('http') ? companyLogo : `${BACKEND_URL}${companyLogo}`}
                alt={companyName}
                className="w-16 h-16 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-text mb-1">{job?.title}</h2>
              <p className="text-text-muted">{companyName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
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
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-text mb-4">Your Application</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted mb-2 block">Cover Letter</label>
              <div className="bg-background border border-border rounded-xl p-4 text-text whitespace-pre-wrap">
                {application.coverLetter}
              </div>
            </div>

            {application.proposedRate && (
              <div>
                <label className="text-sm font-medium text-text-muted mb-2 block">Proposed Rate</label>
                <p className="text-text">${application.proposedRate.toLocaleString()}/hr</p>
              </div>
            )}

            {application.estimatedDuration && (
              <div>
                <label className="text-sm font-medium text-text-muted mb-2 block">Estimated Duration</label>
                <p className="text-text">{application.estimatedDuration}</p>
              </div>
            )}

            {application.resumeUrl && (
              <div>
                <label className="text-sm font-medium text-text-muted mb-2 block">Resume</label>
                <a
                  href={application.resumeUrl.startsWith('http') ? application.resumeUrl : `${BACKEND_URL}${application.resumeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80"
                >
                  View Resume
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {canWithdraw && (
            <Button
              variant="outline"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Application'}
            </Button>
          )}
          <Button
            variant="accent"
            onClick={() => navigate(`/jobs/${job?.id}`)}
          >
            View Job Posting
          </Button>
        </div>
      </div>
    </div>
  );
}
