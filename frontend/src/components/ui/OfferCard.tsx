import type { OfferWithDetails } from '@/types';
import { OfferStatusBadge } from './OfferStatusBadge';
import { Calendar, DollarSign, Clock, User } from 'lucide-react';

interface OfferCardProps {
  offer: OfferWithDetails;
  onViewDetails: (id: string) => void;
  onCancel?: (id: string) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  isClient?: boolean;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

export function OfferCard({ offer, onViewDetails, onCancel, onAccept, onDecline, isClient = false, isAccepting = false, isDeclining = false }: OfferCardProps) {
  const { application, client, freelancer } = offer;
  const job = application.job;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = new Date() > new Date(offer.expiresAt);
  const canCancel = offer.status === 'PENDING' && !isExpired && isClient;
  const canAccept = offer.status === 'PENDING' && !isExpired && !isClient;
  const canDecline = offer.status === 'PENDING' && !isExpired && !isClient;

  return (
    <div className="bg-surface border border-border/50 rounded-xl p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text text-lg mb-1">{offer.title}</h3>
          <p className="text-sm text-text-muted">{job.title}</p>
        </div>
        <OfferStatusBadge status={offer.status} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-muted">
          {isClient ? `To: ${freelancer.name}` : `From: ${client.name}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Budget</p>
            <p className="text-sm font-medium text-text">${offer.proposedBudget.toLocaleString()}</p>
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
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Duration</p>
            <p className="text-sm font-medium text-text">{offer.estimatedDuration}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <span className="text-xs text-text-muted">
          {isExpired ? 'Expired' : `Expires: ${formatDate(offer.expiresAt)}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(offer.id)}
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View Details
          </button>
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(offer.id)}
              className="text-sm font-medium text-error hover:text-error/80 transition-colors"
            >
              Cancel
            </button>
          )}
          {canAccept && onAccept && (
            <button
              onClick={() => onAccept(offer.id)}
              disabled={isAccepting}
              className="text-sm font-medium text-success hover:text-success/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? 'Accepting...' : 'Accept'}
            </button>
          )}
          {canDecline && onDecline && (
            <button
              onClick={() => onDecline(offer.id)}
              disabled={isDeclining}
              className="text-sm font-medium text-error hover:text-error/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeclining ? 'Declining...' : 'Decline'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
