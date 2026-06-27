import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/job.service';
import { savedJobService } from '@/services/saved-job.service';
import { applicationService } from '@/services/application.service';
import { MapPin, DollarSign, Clock, Building2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SaveButton } from '@/components/freelancer/SaveButton';
import { ApplicationModal } from '@/components/ui/ApplicationModal';
import { BACKEND_URL } from '@/lib/constants';
import { EmptyState } from '@/components/freelancer/EmptyState';
import { useAuth } from '@/contexts/AuthContext';

export function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id!),
    enabled: !!id,
  });

  const { data: savedJobsData } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => savedJobService.getSavedJobs(),
  });

  const { data: myApplicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationService.getMyApplications(),
  });

  const isSaved = savedJobsData?.savedJobs.some((sj) => sj.jobId === id) || false;
  const hasApplied = myApplicationsData?.applications.some((app) => app.jobId === id) || false;

  const applyMutation = useMutation({
    mutationFn: (data: { coverLetter: string; proposedRate?: number | string; estimatedDuration?: string; resumeUrl?: string }) =>
      applicationService.applyForJob(id!, {
        ...data,
        proposedRate: typeof data.proposedRate === 'number' ? data.proposedRate : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['jobApplicants', id] });
      queryClient.invalidateQueries({ queryKey: ['freelancerDashboard'] });
      setIsApplicationModalOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 max-w-4xl w-full p-8">
          <div className="h-8 bg-border rounded w-3/4" />
          <div className="h-4 bg-border rounded w-1/2" />
          <div className="h-32 bg-border rounded" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          title="Job not found"
          description="The job you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  const company = job.clientProfile?.company;
  const companyLogo = company?.logoUrl || job.clientProfile?.logoUrl;
  const companyName = company?.name || 'Company';

  const postedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text mb-2">{job.title}</h1>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <span>Posted on {postedDate}</span>
            {job.status === 'OPEN' && (
              <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-medium">
                Open
              </span>
            )}
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            {companyLogo ? (
              <img
                src={`${BACKEND_URL}${companyLogo}`}
                alt={companyName}
                className="w-16 h-16 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-text">{companyName}</h3>
              {company?.industry && (
                <p className="text-sm text-text-muted">{company.industry}</p>
              )}
              {company?.location && (
                <p className="text-sm text-text-muted">{company.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">Job Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                <Clock className="w-5 h-5 text-text-muted" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Job Type</p>
                <p className="font-medium text-text">{job.type === 'FIXED' ? 'Fixed Price' : 'Hourly'}</p>
              </div>
            </div>

            {job.budget && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Budget</p>
                  <p className="font-medium text-text">${job.budget.toLocaleString()}</p>
                </div>
              </div>
            )}

            {job.location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Location</p>
                  <p className="font-medium text-text">{job.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-text-muted" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Work Type</p>
                <p className="font-medium text-text">{job.isRemote ? 'Remote' : 'On-site'}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-text mb-3">Description</h3>
            <div className="prose prose-sm max-w-none text-text-muted whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-text mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-muted"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <SaveButton jobId={job.id} isSaved={isSaved} />
          {user?.role === 'FREELANCER' ? (
            hasApplied ? (
              <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                Applied
              </Button>
            ) : job.status !== 'OPEN' ? (
              <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                {job.status === 'CLOSED' ? 'Closed' : 'Not Available'}
              </Button>
            ) : (
              <Button
                variant="accent"
                onClick={() => setIsApplicationModalOpen(true)}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Submitting...' : 'Apply Now'}
              </Button>
            )
          ) : null}
        </div>

        {/* Application Modal */}
        <ApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          onSubmit={(data) => applyMutation.mutate(data)}
          isSubmitting={applyMutation.isPending}
          jobTitle={job.title}
        />
      </div>
    </div>
  );
}
