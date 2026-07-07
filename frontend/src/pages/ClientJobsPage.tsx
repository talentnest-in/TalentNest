import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientJobService } from '@/services/job.service';
import { JobCard } from '@/components/client/JobCard';
import { EmptyState } from '@/components/client/EmptyState';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Briefcase, Plus, Loader2 } from 'lucide-react';

export function ClientJobsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['clientJobs', statusFilter, searchQuery],
    queryFn: () => clientJobService.getMyJobs({ status: statusFilter, search: searchQuery }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientJobService.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientJobs'] });
      queryClient.invalidateQueries({ queryKey: ['clientDashboard'] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text">Manage Jobs</h1>
            <p className="text-text-muted mt-1">View and manage your posted jobs.</p>
          </div>
          <Button onClick={() => navigate('/jobs/new')} className="gap-2">
            <Plus className="w-4 h-4" /> Post New Job
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Job List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={(id) => {
                  if (confirm('Are you sure you want to delete this job?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-8">
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description={
                searchQuery || statusFilter
                  ? 'Try adjusting your filters.'
                  : "You haven't created any jobs yet."
              }
              actionLabel={!searchQuery && !statusFilter ? 'Post a Job' : undefined}
              onAction={() => navigate('/jobs/new')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
