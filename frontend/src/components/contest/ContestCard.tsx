import { Trophy, Clock, Users, Bookmark, BookmarkCheck, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Contest, ContestStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestService } from '@/services/contest.service';
import { toast } from 'sonner';

interface ContestCardProps {
  contest: Contest;
  showActions?: boolean;
  isSaved?: boolean;
}

const statusColors: Record<ContestStatus, string> = {
  DRAFT: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  PAUSED: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  CLOSED: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
};

const difficultyColors = {
  BEGINNER: 'text-emerald-400',
  INTERMEDIATE: 'text-blue-400',
  ADVANCED: 'text-orange-400',
  EXPERT: 'text-red-400',
};

function formatDeadline(dateStr: string): string {
  const deadline = new Date(dateStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return 'Ended';
  if (diffDays === 0) return 'Ends today';
  if (diffDays === 1) return '1 day left';
  if (diffDays <= 7) return `${diffDays} days left`;
  return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ContestCard({ contest, showActions = true, isSaved = false }: ContestCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => contestService.toggleSave(contest.id),
    onSuccess: (data) => {
      toast.success(data.saved ? 'Contest saved!' : 'Contest removed from saved');
      queryClient.invalidateQueries({ queryKey: ['contests', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
    onError: () => toast.error('Failed to save contest'),
  });

  const isEnded = new Date() > new Date(contest.submissionDeadline);
  const deadlineUrgent =
    !isEnded &&
    new Date(contest.submissionDeadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000; // < 3 days

  return (
    <div
      className="bg-surface border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col cursor-pointer group"
      onClick={() => navigate(`/contests/${contest.slug}`)}
    >
      {/* Featured Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 overflow-hidden">
        {contest.featuredImage ? (
          <img
            src={contest.featuredImage}
            alt={contest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-16 h-16 text-primary/30" />
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[contest.status]}`}>
          {contest.status}
        </span>
        {/* Save button */}
        {showActions && user && user.role === 'FREELANCER' && (
          <button
            className="absolute top-3 right-3 p-2 bg-surface/80 backdrop-blur-sm rounded-full hover:bg-surface transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              saveMutation.mutate();
            }}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary" />
            ) : (
              <Bookmark className="w-4 h-4 text-text-muted" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Category & Difficulty */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted bg-border/30 px-2 py-1 rounded-full">
            {contest.category}
          </span>
          <span className={`text-xs font-semibold ${difficultyColors[contest.difficulty]}`}>
            {contest.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-text text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {contest.title}
        </h3>

        {/* Prize */}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-yellow-500/15 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <span className="text-lg font-bold text-yellow-400">
            ${Number(contest.prizeAmount).toLocaleString()}
          </span>
          <span className="text-xs text-text-muted">prize</span>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {contest.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
          {contest.skills.length > 3 && (
            <span className="text-xs text-text-muted">+{contest.skills.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-border/30 flex items-center justify-between">
          <div className={`flex items-center gap-1 text-xs font-medium ${deadlineUrgent ? 'text-red-400' : 'text-text-muted'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDeadline(contest.submissionDeadline)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {contest._count?.participants ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {contest.viewCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
