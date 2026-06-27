import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { jobService } from '@/services/job.service';
import { Button } from '@/components/ui/Button';
import {
  Search, Briefcase, MapPin, DollarSign, Clock, SlidersHorizontal,
  ChevronLeft, ChevronRight, Loader2, Building2, Wifi,
} from 'lucide-react';
import type { Job, JobType } from '@/types';

function FreelancerJobCard({ job, index }: { job: Job; index: number }) {
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const company = (job as any).clientProfile?.company;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-surface border border-border/50 rounded-2xl p-6 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200 cursor-pointer flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-border flex items-center justify-center shrink-0">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text text-lg leading-snug line-clamp-1 group-hover:text-accent transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-text-muted mt-0.5">
            {company?.name ?? 'Anonymous Client'}
          </p>
        </div>
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
            job.type === 'FIXED'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}
        >
          {job.type === 'FIXED' ? 'Fixed Price' : 'Hourly'}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">{job.description}</p>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((s) => (
            <span
              key={s.id}
              className="px-2.5 py-0.5 text-xs font-medium bg-accent/10 text-accent border border-accent/20 rounded-full"
            >
              {s.name}
            </span>
          ))}
          {job.skills.length > 6 && (
            <span className="px-2.5 py-0.5 text-xs text-text-muted">+{job.skills.length - 6} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
          {job.budget && (
            <span className="flex items-center gap-1.5 font-medium text-success">
              <DollarSign className="w-3.5 h-3.5" />
              {job.budget.toLocaleString()}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            {job.isRemote ? <Wifi className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            {job.isRemote ? 'Remote' : job.location ?? 'On-site'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(job.createdAt)}
          </span>
        </div>
        <Button size="sm" variant="accent" className="text-xs font-semibold">
          Apply Now
        </Button>
      </div>
    </motion.div>
  );
}

export function FreelancerJobsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<JobType | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['openJobs', search, typeFilter, page],
    queryFn: () => jobService.getOpenJobs({ search, type: typeFilter, page: page.toString() }),
    placeholderData: (prev) => prev,
  });

  const jobs = data?.jobs ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Find Jobs</h1>
              <p className="text-sm text-text-muted">
                {total > 0 ? `${total} open positions available` : 'Browse freelance opportunities'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <div className="bg-surface border border-border/50 rounded-2xl p-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search jobs, skills, or companies..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </form>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap gap-3 pt-2 border-t border-border/50"
            >
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-text-muted whitespace-nowrap">Job Type</label>
                <select
                  value={typeFilter || ''}
                  onChange={(e) => { setTypeFilter(e.target.value as JobType || undefined); setPage(1); }}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">All Types</option>
                  <option value="FIXED">Fixed Price</option>
                  <option value="HOURLY">Hourly Rate</option>
                </select>
              </div>
              {(search || typeFilter) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(''); setTypeFilter(undefined); setPage(1); }}
                  className="text-xs text-text-muted"
                >
                  Clear filters
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Job Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <p className="text-sm text-text-muted">Finding the best jobs for you…</p>
          </div>
        ) : jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface border border-border/50 rounded-2xl p-16 text-center"
          >
            <Briefcase className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold text-text mb-2">No jobs found</p>
            <p className="text-sm text-text-muted">
              {search || typeFilter
                ? 'Try adjusting your search or filters.'
                : 'No open positions available right now. Check back soon!'}
            </p>
            {(search || typeFilter) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => { setSearch(''); setTypeFilter(undefined); setPage(1); }}
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job, i) => (
              <FreelancerJobCard key={job.id} job={job} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm text-text-muted px-2">
              Page <span className="font-semibold text-text">{page}</span> of{' '}
              <span className="font-semibold text-text">{totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1.5"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
