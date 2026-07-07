import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { savedJobService } from '@/services/saved-job.service';
import { SavedJobCard } from '@/components/freelancer/SavedJobCard';
import { EmptyState } from '@/components/freelancer/EmptyState';
import { ArrowLeft } from 'lucide-react';

export function SavedJobs() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => savedJobService.getSavedJobs(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-heading font-bold text-text mb-2">Saved Jobs</h1>
            <p className="text-text-muted">Jobs you've bookmarked for later</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-border" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-border rounded w-3/4" />
                    <div className="h-4 bg-border rounded w-1/2" />
                    <div className="h-4 bg-border rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          title="Error loading saved jobs"
          description="Something went wrong. Please try again later."
        />
      </div>
    );
  }

  const savedJobs = data?.savedJobs || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Saved Jobs</h1>
          <p className="text-text-muted">
            {savedJobs.length === 0
              ? 'You haven\'t saved any jobs yet'
              : `${savedJobs.length} job${savedJobs.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>

        {/* Saved Jobs List */}
        {savedJobs.length === 0 ? (
          <EmptyState
            title="No saved jobs"
            description="Start browsing jobs and save the ones you're interested in. They'll appear here for easy access."
          />
        ) : (
          <div className="space-y-4">
            {savedJobs.map((savedJob) => (
              <SavedJobCard key={savedJob.id} savedJob={savedJob} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
