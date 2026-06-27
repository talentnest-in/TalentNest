import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApplicationService } from '@/services/client-application.service';
import { offerService } from '@/services/offer.service';
import { ApplicationStatusBadge } from '@/components/shared/ApplicationStatusBadge';
import { StatusDropdown } from '@/components/shared/StatusDropdown';
import { ResumePreviewCard } from '@/components/shared/ResumePreviewCard';
import { PortfolioPreview } from '@/components/shared/PortfolioPreview';
import { Button } from '@/components/ui/Button';
import { OfferModal } from '@/components/ui/OfferModal';
import { ArrowLeft, MapPin, DollarSign, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ApplicationStatus } from '@/types';

export function ApplicantDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['applicant', id],
    queryFn: () => clientApplicationService.getApplicantDetails(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => 
      clientApplicationService.updateApplicationStatus(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      queryClient.invalidateQueries({ queryKey: ['jobApplicants'] });
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: (data: { applicationId: string; title: string; message: string; proposedBudget: number; currency: string; estimatedDuration?: string; deadline?: string }) =>
      offerService.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant', id] });
      queryClient.invalidateQueries({ queryKey: ['clientOffers'] });
      queryClient.invalidateQueries({ queryKey: ['clientDashboard'] });
      setIsOfferModalOpen(false);
    },
  });

  const handleCreateOffer = (data: { applicationId: string; title: string; message: string; proposedBudget: number; currency: string; estimatedDuration?: string; deadline?: string }) => {
    createOfferMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
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
          <p className="text-text-muted mb-4">Applicant not found</p>
          <Button variant="outline" onClick={() => navigate('/client/jobs')}>
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const application = data.application;
  const profile = application.profile;
  const user = profile.user;

  const canUpdateStatus = application.status !== 'WITHDRAWN' && application.status !== 'REJECTED' && application.status !== 'HIRED';
  const canSendOffer = application.status === 'SHORTLISTED' && !application.offer;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-text mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text mb-2">{user?.name || 'Anonymous'}</h1>
              <p className="text-text-muted">{profile.title || 'Freelancer'}</p>
            </div>
            <div className="flex items-center gap-4">
              <ApplicationStatusBadge status={application.status} />
              {canSendOffer && (
                <Button
                  onClick={() => setIsOfferModalOpen(true)}
                  className="gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Send Offer
                </Button>
              )}
              {canUpdateStatus && (
                <StatusDropdown
                  value={application.status}
                  onChange={(status) => updateStatusMutation.mutate(status)}
                  disabled={updateStatusMutation.isPending}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-text">{user?.name || 'Anonymous'}</h3>
                  <p className="text-sm text-text-muted">{profile.title || 'Freelancer'}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {profile.location && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                {profile.hourlyRate && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <DollarSign className="w-4 h-4" />
                    ${profile.hourlyRate.toLocaleString()}/hr
                  </div>
                )}
                {user?.email && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-text mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume */}
            <ResumePreviewCard resumeUrl={profile.resumeUrl} />
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-text mb-4">Application Details</h3>
              
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
                      href={application.resumeUrl.startsWith('http') ? application.resumeUrl : application.resumeUrl}
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

            {/* Experience */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-text mb-4">Experience</h3>
                <div className="space-y-4">
                  {profile.experiences.map((exp) => (
                    <div key={exp.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-text">{exp.role}</h4>
                        {exp.current && (
                          <span className="text-xs text-accent">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted mb-1">{exp.company}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {' - '}
                        {exp.endDate
                          ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'Present'}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-text-muted mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.educations && profile.educations.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-text mb-4">Education</h3>
                <div className="space-y-4">
                  {profile.educations.map((edu) => (
                    <div key={edu.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-medium text-text">{edu.degree}</h4>
                      <p className="text-sm text-text-muted mb-1">{edu.institution}</p>
                      <p className="text-xs text-text-muted">{edu.fieldOfStudy}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {' - '}
                        {edu.endDate
                          ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile.projects && profile.projects.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-semibold text-text mb-4">Portfolio</h3>
                <PortfolioPreview projects={profile.projects} />
              </div>
            )}
          </div>
        </div>

        {/* Offer Modal */}
        <OfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          onSubmit={handleCreateOffer}
          isSubmitting={createOfferMutation.isPending}
          applicationId={application.id}
          jobTitle={application.job?.title || 'Job'}
          freelancerName={user?.name || 'Freelancer'}
        />
      </div>
    </div>
  );
}
