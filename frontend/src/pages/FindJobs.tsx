import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/services/job.service';
import type { JobsQueryParams } from '@/types';
import { JobCard } from '@/components/freelancer/JobCard';
import { SearchBar } from '@/components/freelancer/SearchBar';
import { JobFilters } from '@/components/freelancer/JobFilters';
import { Pagination } from '@/components/freelancer/Pagination';
import { EmptyState } from '@/components/freelancer/EmptyState';
import { NoResults } from '@/components/freelancer/NoResults';
import { JobsListSkeleton } from '@/components/freelancer/LoadingSkeleton';
import { ArrowLeft } from 'lucide-react';

export function FindJobs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<JobsQueryParams>({
    type: undefined,
    minBudget: undefined,
    maxBudget: undefined,
    isRemote: undefined,
    datePosted: undefined,
    sortBy: 'newest',
    page: '1',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: '1' }));
  }, [debouncedSearch, filters.type, filters.minBudget, filters.maxBudget, filters.isRemote, filters.datePosted, filters.sortBy]);

  const queryKey = ['jobs', { ...filters, search: debouncedSearch }];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => jobService.getOpenJobs({ ...filters, search: debouncedSearch }),
  });

  const handleTypeChange = (type: any) => setFilters((prev) => ({ ...prev, type }));
  const handleMinBudgetChange = (value: string) => setFilters((prev) => ({ ...prev, minBudget: value || undefined }));
  const handleMaxBudgetChange = (value: string) => setFilters((prev) => ({ ...prev, maxBudget: value || undefined }));
  const handleRemoteChange = (value: string) => setFilters((prev) => ({ ...prev, isRemote: value || undefined }));
  const handleDatePostedChange = (value: string) => setFilters((prev) => ({ ...prev, datePosted: value === 'any' ? undefined : value }));
  const handleSortChange = (value: string) => setFilters((prev) => ({ ...prev, sortBy: value as any }));
  const handlePageChange = (page: number) => setFilters((prev) => ({ ...prev, page: page.toString() }));

  const hasActiveFilters = !!filters.type || !!filters.minBudget || !!filters.maxBudget || !!filters.isRemote || !!filters.datePosted;

  const handleClearFilters = () => {
    setFilters({
      type: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      isRemote: undefined,
      datePosted: undefined,
      sortBy: 'newest',
      page: '1',
    });
    setSearch('');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          title="Error loading jobs"
          description="Something went wrong. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
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
          <h1 className="text-2xl font-heading font-bold text-text mb-2">Find Jobs</h1>
          <p className="text-text-muted">Discover your next opportunity</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title, description, or skills..." />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-80 shrink-0">
            <JobFilters
              type={filters.type}
              minBudget={filters.minBudget}
              maxBudget={filters.maxBudget}
              isRemote={filters.isRemote}
              datePosted={filters.datePosted}
              sortBy={filters.sortBy}
              onTypeChange={handleTypeChange}
              onMinBudgetChange={handleMinBudgetChange}
              onMaxBudgetChange={handleMaxBudgetChange}
              onRemoteChange={handleRemoteChange}
              onDatePostedChange={handleDatePostedChange}
              onSortChange={handleSortChange}
              onClear={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </aside>

          {/* Jobs List */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <JobsListSkeleton />
            ) : data && data.jobs.length > 0 ? (
              <>
                <div className="space-y-4 mb-6">
                  {data.jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <Pagination
                  currentPage={data.page}
                  totalPages={data.totalPages}
                  total={data.total}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <NoResults query={debouncedSearch} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
