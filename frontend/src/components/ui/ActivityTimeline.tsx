import { Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: 'offer_sent' | 'offer_accepted' | 'offer_declined' | 'contract_created' | 'contract_completed' | 'contract_cancelled';
  description: string;
  timestamp: string;
  userName?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (activities.length === 0) {
    return (
      <div className="bg-surface border border-border/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Activity Timeline</h2>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-text-muted">No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border/50 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-text mb-4">Activity Timeline</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="mt-1 text-text-muted">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{activity.description}</p>
              {activity.userName && (
                <p className="text-xs text-text-muted mt-0.5">by {activity.userName}</p>
              )}
              <p className="text-xs text-text-muted mt-1">{formatDate(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
