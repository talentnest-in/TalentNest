import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface UserStats {
  exp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalExpEarned: number;
  lastLoginDate: string | null;
  progressToNextLevel: number;
}

function getStreakColor(streak: number) {
  if (streak >= 30) return 'text-red-500';
  if (streak >= 14) return 'text-orange-500';
  if (streak >= 7) return 'text-amber-500';
  return 'text-yellow-500';
}

export function GamificationCard() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['gamification-stats'],
    queryFn: () => api.get('/gamification/stats').then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-2.5 bg-gray-200 rounded w-full mb-3" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const level = stats?.level || 1;
  const progress = stats?.progressToNextLevel || 0;
  const streak = stats?.currentStreak || 0;
  const streakColor = getStreakColor(streak);

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text">Your Progress</h3>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
          <Trophy className="h-3.5 w-3.5 text-accent" />
          <span className="text-sm font-bold text-accent">Level {level}</span>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-text-muted">Progress to Level {level + 1}</span>
          <span className="text-text font-semibold">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full bg-accent relative overflow-hidden"
          >
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
        <p className="text-xs text-text-muted mt-1.5">
          {stats?.exp || 0} EXP · {Math.max(0, (level * 100) - (stats?.exp || 0))} to next level
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background border border-border rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-base font-bold text-text">{stats?.exp || 0}</p>
          <p className="text-xs text-text-muted mt-0.5">Current EXP</p>
        </div>

        <div className="bg-background border border-border rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <motion.div
              animate={streak > 0 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame className={`h-3.5 w-3.5 ${streakColor}`} />
            </motion.div>
          </div>
          <p className={`text-base font-bold ${streakColor}`}>{streak}</p>
          <p className="text-xs text-text-muted mt-0.5">Day Streak</p>
        </div>

        <div className="bg-background border border-border rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-base font-bold text-text">{stats?.totalExpEarned || 0}</p>
          <p className="text-xs text-text-muted mt-0.5">Total EXP</p>
        </div>
      </div>

      {/* Streak bonus hint */}
      {streak >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2"
        >
          <Flame className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            🔥 {streak}-day streak! Keep it up for bonus EXP multipliers.
          </p>
        </motion.div>
      )}
    </div>
  );
}
