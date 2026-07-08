import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { contestService } from '@/services/contest.service';
import { ContestCard } from '@/components/contest/ContestCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Star, Bookmark, Users, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/components/ui/Button';

type Tab = 'joined' | 'submitted' | 'won' | 'saved';

export function FreelancerContestDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('joined');

  const { data: joinedContests = [], isLoading: loadingJoined } = useQuery({
    queryKey: ['contests', 'joined'],
    queryFn: () => contestService.getJoinedContests(),
  });

  const { data: savedContests = [], isLoading: loadingSaved } = useQuery({
    queryKey: ['contests', 'saved'],
    queryFn: () => contestService.getSavedContests(),
  });

  const submittedContests = joinedContests.filter((c) =>
    c.submissions?.some((s) => s.participantId === user?.id)
  );

  const wonContests = joinedContests.filter(
    (c) => c.winnerId === user?.id
  );

  const tabs = [
    { id: 'joined' as Tab, label: 'Joined', icon: Users, count: joinedContests.length },
    { id: 'submitted' as Tab, label: 'Submitted', icon: Trophy, count: submittedContests.length },
    { id: 'won' as Tab, label: 'Won', icon: Star, count: wonContests.length },
    { id: 'saved' as Tab, label: 'Saved', icon: Bookmark, count: savedContests.length },
  ];

  const isLoading = loadingJoined || loadingSaved;

  const activeContests =
    activeTab === 'joined' ? joinedContests :
    activeTab === 'submitted' ? submittedContests :
    activeTab === 'won' ? wonContests :
    savedContests;

  const stats = {
    participated: joinedContests.length,
    wins: wonContests.length,
    winRate: joinedContests.length ? Math.round((wonContests.length / joinedContests.length) * 100) : 0,
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" /> My Contests
            </h1>
            <p className="text-text-muted text-sm mt-1">Track your contest activity</p>
          </div>
          <Button onClick={() => navigate('/contests')} className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Browse Contests
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Participated', value: stats.participated, color: 'text-primary' },
            { label: 'Contests Won', value: stats.wins, color: 'text-yellow-400' },
            { label: 'Win Rate', value: `${stats.winRate}%`, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface border border-border/50 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border/50 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  activeTab === tab.id ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={cn('text-xs', activeTab === tab.id ? 'opacity-70' : 'opacity-50')}>({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : activeContests.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nothing here yet</p>
            {activeTab === 'joined' && (
              <Button className="mt-4" onClick={() => navigate('/contests')}>
                Browse Contests
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeContests.map((contest, i) => (
              <motion.div
                key={contest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ContestCard
                  contest={contest}
                  isSaved={savedContests.some((s) => s.id === contest.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
