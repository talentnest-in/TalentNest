import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '@/services/application.service';
import type { ApplicationsQueryParams, ApplicationStatus } from '@/types';
import { ApplicationCard } from '@/components/freelancer/ApplicationCard';
import { EmptyApplicationsState } from '@/components/shared/EmptyApplicationsState';
import { Button } from '@/components/ui/Button';
import { Search, Filter } from 'lucide-react';

export function MyApplications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const params: ApplicationsQueryParams = {
    page: page.toString(),
    search: search || undefined,
    status: statusFilter,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['myApplications', params],
    queryFn: () => applicationService.getMyApplications(params),
  });

  const applications = data?.applications || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const handleStatusChange = (status: ApplicationStatus | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyApplicationsState
          title="Error loading applications"
          description="Something went wrong. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-text mb-2">My Applications</h1>
          <p className="text-text-muted">
            {total > 0 ? `${total} application${total !== 1 ? 's' : ''} submitted` : 'Track your job applications'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by job title..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select
                value={statusFilter || ''}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus || undefined)}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-surface"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWING">Reviewing</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
            {(search || statusFilter) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-border rounded w-3/4 mb-4" />
                <div className="h-4 bg-border rounded w-1/2 mb-2" />
                <div className="h-4 bg-border rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <EmptyApplicationsState
            title={search || statusFilter ? 'No applications found' : 'No applications yet'}
            description={
              search || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'Start applying to jobs to track your applications here.'
            }
          />
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
