import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { offerService } from '@/services/offer.service';
import { OfferCard } from '@/components/ui/OfferCard';
import type { OfferStatus } from '@/types';
import { Search, Filter } from 'lucide-react';

export function ClientOffersList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OfferStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['clientOffers', statusFilter, searchQuery, page],
    queryFn: () =>
      offerService.getClientOffers({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 10,
      }),
  });

  const handleViewDetails = (id: string) => {
    navigate(`/client/offers/${id}`);
  };

  const handleCancel = (id: string) => {
    // TODO: Implement cancel offer with confirmation
    console.log('Cancel offer:', id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-muted">Loading offers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-error">Error loading offers</div>
      </div>
    );
  }

  const offers = data?.offers || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-2">My Offers</h1>
        <p className="text-sm text-text-muted">Manage offers you've sent to freelancers</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border/50 rounded-lg bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OfferStatus | '')}
            className="px-3 py-2 border border-border/50 rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DECLINED">Declined</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
            <Filter className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">No offers found</h3>
          <p className="text-sm text-text-muted text-center max-w-sm mb-6">
            {searchQuery || statusFilter
              ? 'Try adjusting your filters or search terms'
              : 'You haven\'t sent any offers yet. Send offers to shortlisted applicants.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onViewDetails={handleViewDetails}
                onCancel={handleCancel}
                isClient={true}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border/50 rounded-lg bg-background text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-border/50 rounded-lg bg-background text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
