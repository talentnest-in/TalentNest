import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Plus, Eye, Pause, Play, X, Copy, Loader2,
  Users, FileText
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { contestService } from '@/services/contest.service';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import type { Contest, ContestStatus } from '@/types';
import { cn } from '@/components/ui/Button';

const TABS: { status: ContestStatus | 'ALL'; label: string }[] = [
  { status: 'ALL', label: 'All' },
  { status: 'DRAFT', label: 'Drafts' },
  { status: 'PUBLISHED', label: 'Published' },
  { status: 'PAUSED', label: 'Paused' },
  { status: 'CLOSED', label: 'Closed' },
];

export function ClientContestDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<ContestStatus | 'ALL'>('ALL');

  const { data: allContests = [], isLoading } = useQuery({
    queryKey: ['contests', 'client'],
    queryFn: () => contestService.getClientContests(),
  });

  const contests = activeStatus === 'ALL'
    ? allContests
    : allContests.filter((c) => c.status === activeStatus);

  const publishMutation = useMutation({
    mutationFn: (id: string) => contestService.publish(id),
    onSuccess: () => { toast.success('Contest published!'); queryClient.invalidateQueries({ queryKey: ['contests', 'client'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => contestService.pause(id),
    onSuccess: () => { toast.success('Contest paused'); queryClient.invalidateQueries({ queryKey: ['contests', 'client'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => contestService.close(id),
    onSuccess: () => { toast.success('Contest closed'); queryClient.invalidateQueries({ queryKey: ['contests', 'client'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => contestService.reopen(id),
    onSuccess: () => { toast.success('Contest reopened!'); queryClient.invalidateQueries({ queryKey: ['contests', 'client'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => contestService.duplicate(id),
    onSuccess: () => { toast.success('Contest duplicated as draft'); queryClient.invalidateQueries({ queryKey: ['contests', 'client'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contestService.delete(id),
    onSuccess: () => { toast.success('Contest deleted'); queryClient.invalidateQueries({ queryKey: ['contests', 'client'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = {
    total: allContests.length,
    published: allContests.filter((c) => c.status === 'PUBLISHED').length,
    totalParticipants: allContests.reduce((acc, c) => acc + (c._count?.participants ?? 0), 0),
    totalSubmissions: allContests.reduce((acc, c) => acc + (c._count?.submissions ?? 0), 0),
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" /> My Contests
            </h1>
            <p className="text-text-muted text-sm mt-1">Manage all your contests</p>
          </div>
          <Button onClick={() => navigate('/contests/create')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Contest
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Contests', value: stats.total, icon: Trophy, color: 'text-primary' },
            { label: 'Published', value: stats.published, icon: Eye, color: 'text-emerald-400' },
            { label: 'Total Participants', value: stats.totalParticipants, icon: Users, color: 'text-blue-400' },
            { label: 'Submissions', value: stats.totalSubmissions, icon: FileText, color: 'text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface border border-border/50 rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-text">{value}</p>
              <p className="text-xs text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border/50 rounded-xl p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => setActiveStatus(tab.status)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                activeStatus === tab.status ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
              )}
            >
              {tab.label}
              {tab.status !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({allContests.filter((c) => c.status === tab.status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contest List */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No contests here</p>
            <Button className="mt-4" onClick={() => navigate('/contests/create')}>
              <Plus className="w-4 h-4 mr-2" /> Create your first contest
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contests.map((contest, i) => (
              <ContestRow
                key={contest.id}
                contest={contest}
                index={i}
                onPublish={() => publishMutation.mutate(contest.id)}
                onPause={() => pauseMutation.mutate(contest.id)}
                onClose={() => closeMutation.mutate(contest.id)}
                onReopen={() => reopenMutation.mutate(contest.id)}
                onDuplicate={() => duplicateMutation.mutate(contest.id)}
                onDelete={() => {
                  if (confirm(`Delete "${contest.title}"? This cannot be undone.`)) {
                    deleteMutation.mutate(contest.id);
                  }
                }}
                onViewSubmissions={() => navigate(`/contests/${contest.id}/submissions`)}
                onViewAnalytics={() => navigate(`/contests/${contest.id}/analytics`)}
                onView={() => navigate(`/contests/${contest.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface ContestRowProps {
  contest: Contest;
  index: number;
  onPublish: () => void;
  onPause: () => void;
  onClose: () => void;
  onReopen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onViewSubmissions: () => void;
  onViewAnalytics: () => void;
  onView: () => void;
}

function ContestRow({ contest, index, onPublish, onPause, onClose, onReopen, onDuplicate, onDelete, onViewSubmissions, onView }: ContestRowProps) {
  const statusColors: Record<ContestStatus, string> = {
    DRAFT: 'bg-yellow-500/15 text-yellow-400',
    PUBLISHED: 'bg-emerald-500/15 text-emerald-400',
    PAUSED: 'bg-orange-500/15 text-orange-400',
    CLOSED: 'bg-gray-500/15 text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-surface border border-border/50 rounded-xl p-5 hover:border-primary/20 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/20 flex-shrink-0 flex items-center justify-center">
          {contest.featuredImage ? (
            <img src={contest.featuredImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <Trophy className="w-7 h-7 text-primary/50" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text line-clamp-1">{contest.title}</h3>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', statusColors[contest.status])}>
              {contest.status}
            </span>
          </div>
          <p className="text-sm text-text-muted mt-0.5 line-clamp-1">{contest.category} · {contest.difficulty}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{contest._count?.participants ?? 0} participants</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{contest._count?.submissions ?? 0} submissions</span>
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" />${Number(contest.prizeAmount).toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onView} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={onViewSubmissions} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Submissions"><FileText className="w-4 h-4" /></button>
          <button onClick={onDuplicate} className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Duplicate"><Copy className="w-4 h-4" /></button>

          {contest.status === 'DRAFT' && (
            <Button size="sm" onClick={onPublish}>Publish</Button>
          )}
          {contest.status === 'PUBLISHED' && (
            <>
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="w-3.5 h-3.5 mr-1" /> Pause
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} className="text-red-400 border-red-500/20 hover:bg-red-500/10">
                <X className="w-3.5 h-3.5 mr-1" /> Close
              </Button>
            </>
          )}
          {contest.status === 'PAUSED' && (
            <Button size="sm" onClick={onReopen}>
              <Play className="w-3.5 h-3.5 mr-1" /> Reopen
            </Button>
          )}

          <button onClick={onDelete} className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
