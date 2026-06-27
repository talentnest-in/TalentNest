import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { offerService } from '@/services/offer.service';
import { OfferStatusBadge } from '@/components/ui/OfferStatusBadge';
import { Calendar, DollarSign, Clock, User, ArrowLeft } from 'lucide-react';

export function OfferDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => offerService.getOfferDetails(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => offerService.cancelOffer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
      queryClient.invalidateQueries({ queryKey: ['clientOffers'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => offerService.acceptOffer(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
      queryClient.invalidateQueries({ queryKey: ['freelancerOffers'] });
      queryClient.invalidateQueries({ queryKey: ['freelancerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      if (data.contract) {
        navigate(`/contracts/${data.contract.id}`);
      }
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => offerService.declineOffer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
      queryClient.invalidateQueries({ queryKey: ['freelancerOffers'] });
      queryClient.invalidateQueries({ queryKey: ['freelancerDashboard'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-muted">Loading offer details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-error">Error loading offer details</div>
      </div>
    );
  }

  const offer = data.offer;
  const { application, client, freelancer } = offer;
  const job = application.job;
  const isClient = client.id === offer.clientId;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = new Date() > new Date(offer.expiresAt);
  const canCancel = offer.status === 'PENDING' && !isExpired && isClient;
  const canAccept = offer.status === 'PENDING' && !isExpired && !isClient;
  const canDecline = offer.status === 'PENDING' && !isExpired && !isClient;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-surface border border-border/50 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text mb-2">{offer.title}</h1>
            <p className="text-sm text-text-muted">{job.title}</p>
          </div>
          <OfferStatusBadge status={offer.status} />
        </div>

        <div className="flex items-center gap-2 mb-6">
          <User className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">
            {isClient ? `To: ${freelancer.name}` : `From: ${client.name}`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Budget</p>
              <p className="text-sm font-medium text-text">${offer.proposedBudget.toLocaleString()} {offer.currency}</p>
            </div>
          </div>
          {offer.deadline && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Deadline</p>
                <p className="text-sm font-medium text-text">{formatDate(offer.deadline)}</p>
              </div>
            </div>
          )}
        </div>

        {offer.estimatedDuration && (
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Duration</p>
              <p className="text-sm font-medium text-text">{offer.estimatedDuration}</p>
            </div>
          </div>
        )}

        <div className="border-t border-border/50 pt-6">
          <h2 className="text-lg font-semibold text-text mb-3">Message</h2>
          <p className="text-sm text-text-muted whitespace-pre-wrap">{offer.message}</p>
        </div>

        <div className="border-t border-border/50 pt-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Expires</p>
              <p className="text-sm font-medium text-text">{formatDate(offer.expiresAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              {canCancel && (
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 border border-error/50 text-error rounded-lg font-medium hover:bg-error/10 transition-colors disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Offer'}
                </button>
              )}
              {canAccept && (
                <button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                  className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  {acceptMutation.isPending ? 'Accepting...' : 'Accept Offer'}
                </button>
              )}
              {canDecline && (
                <button
                  onClick={() => declineMutation.mutate()}
                  disabled={declineMutation.isPending}
                  className="px-4 py-2 border border-error/50 text-error rounded-lg font-medium hover:bg-error/10 transition-colors disabled:opacity-50"
                >
                  {declineMutation.isPending ? 'Declining...' : 'Decline Offer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {offer.contract && (
        <div className="bg-surface border border-border/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text mb-3">Contract Created</h2>
          <p className="text-sm text-text-muted mb-4">
            This offer was accepted and a contract has been created.
          </p>
          <button
            onClick={() => navigate(`/contracts/${offer.contract?.id}`)}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            View Contract
          </button>
        </div>
      )}
    </div>
  );
}
