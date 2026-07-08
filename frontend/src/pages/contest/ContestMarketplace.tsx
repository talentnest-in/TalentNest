import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Plus, Loader2, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { contestService, type ContestFilters as IFilters } from '@/services/contest.service';
import { ContestCard } from '@/components/contest/ContestCard';
import { ContestFilters, type FilterState } from '@/components/contest/ContestFilters';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export function ContestMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({ search: '', category: '', difficulty: '', sort: 'newest' });
  const [page, setPage] = useState(1);

  const queryParams: IFilters = {
    page,
    limit: 12,
    sort: filters.sort as any,
    ...(filters.category && { category: filters.category }),
    ...(filters.difficulty && { difficulty: filters.difficulty }),
    ...(filters.search && { search: filters.search }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['contests', 'browse', queryParams],
    queryFn: () => contestService.browse(queryParams),
  });

  // Featured
  const { data: featuredData } = useQuery({
    queryKey: ['contests', 'featured'],
    queryFn: () => contestService.browse({ limit: 3, sort: 'popular' }),
  });

  const contests = data?.data ?? [];
  const meta = data?.meta;
  const featured = featuredData?.data ?? [];

  const handleFilterChange = (f: FilterState) => {
    setFilters(f);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Contest Hub
            </h1>
            <p className="text-text-muted mt-1">Compete, showcase your skills, and win prizes</p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'FREELANCER' && (
              <Button variant="outline" onClick={() => navigate('/contests/my')}>
                My Contests
              </Button>
            )}
            {user?.role === 'CLIENT' && (
              <>
                <Button variant="outline" onClick={() => navigate('/contests/manage')}>
                  Manage Contests
                </Button>
                <Button onClick={() => navigate('/contests/create')} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Contest
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Featured Contests */}
        {!isLoading && featured.length > 0 && !filters.search && !filters.category && !filters.difficulty && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-text">Featured Contests</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featured.map((contest, i) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ContestCard contest={contest} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <ContestFilters filters={filters} onChange={handleFilterChange} />

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-muted font-medium">No contests found</p>
            <p className="text-sm text-text-muted mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {contests.map((contest, i) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ContestCard contest={contest} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-text-muted px-4">
                  Page {page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
