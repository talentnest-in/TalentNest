import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Trophy, Lock, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Achievement {
  id: string; key: string; title: string; description: string;
  category: string; icon: string; condition: any; expReward: number;
}

interface UserAchievement {
  id: string; userId: string; achievementId: string; unlockedAt: string; achievement: Achievement;
}

const CATEGORY_COLORS: Record<string, string> = {
  FREELANCING: 'bg-blue-50 text-blue-700 border-blue-200',
  LEARNING: 'bg-purple-50 text-purple-700 border-purple-200',
  COMMUNITY: 'bg-green-50 text-green-700 border-green-200',
  CREATOR: 'bg-pink-50 text-pink-700 border-pink-200',
  CONTEST: 'bg-orange-50 text-orange-700 border-orange-200',
  CAREER: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function AchievementsPage() {
  const { data: userAchievements, isLoading: loadingUser } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: () => api.get('/gamification/achievements').then(res => res.data),
  });

  const { data: allAchievements, isLoading: loadingAll } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: () => api.get('/gamification/achievements/all').then(res => res.data),
  });

  const isLoading = loadingUser || loadingAll;

  const unlockedMap = new Map<string, UserAchievement>();
  userAchievements?.forEach((ua: UserAchievement) => unlockedMap.set(ua.achievementId, ua));

  const unlockedAchievements = allAchievements?.filter((a: Achievement) => unlockedMap.has(a.id)) || [];
  const lockedAchievements = allAchievements?.filter((a: Achievement) => !unlockedMap.has(a.id)) || [];
  const completionPct = allAchievements?.length
    ? Math.round((unlockedAchievements.length / allAchievements.length) * 100) : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Achievements</h1>
          <p className="text-text-muted">Track your progress and unlock rewards as you complete activities on TalentNest.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: <Trophy className="h-6 w-6 text-accent" />, bg: 'bg-accent/10', value: unlockedAchievements.length, label: 'Unlocked' },
            { icon: <Lock className="h-6 w-6 text-primary" />, bg: 'bg-primary/10', value: lockedAchievements.length, label: 'Locked' },
            { icon: <CheckCircle2 className="h-6 w-6 text-success" />, bg: 'bg-success/10', value: `${completionPct}%`, label: 'Completion' },
          ].map(({ icon, bg, value, label }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>
              <div>
                <p className="text-2xl font-bold text-text">{value}</p>
                <p className="text-sm text-text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Unlocked */}
        {unlockedAchievements.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold text-text">Unlocked Achievements</h2>
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-bold rounded-full border border-accent/20">{unlockedAchievements.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {unlockedAchievements.map((a: Achievement, i: number) => {
                const ua = unlockedMap.get(a.id)!;
                const catColor = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.CAREER;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-surface border border-border rounded-xl p-5 hover:shadow-lg transition-all hover:border-accent/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-2xl">
                        {a.icon || '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${catColor}`}>{a.category}</span>
                        </div>
                        <h3 className="font-semibold text-text text-sm mb-1">{a.title}</h3>
                        <p className="text-xs text-text-muted mb-3">{a.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent">
                            <Zap className="h-3 w-3" /> +{a.expReward} EXP
                          </span>
                          <span className="text-xs text-text-muted">
                            {new Date(ua.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Locked */}
        {lockedAchievements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-text-muted" />
              <h2 className="text-xl font-semibold text-text">Locked Achievements</h2>
              <span className="px-2 py-0.5 bg-background text-text-muted text-xs font-bold rounded-full border border-border">{lockedAchievements.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lockedAchievements.map((a: Achievement, i: number) => {
                const catColor = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.CAREER;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-surface border border-border rounded-xl p-5 opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0">
                        <Lock className="h-6 w-6 text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${catColor} opacity-70`}>{a.category}</span>
                        </div>
                        <h3 className="font-semibold text-text text-sm mb-1">{a.title}</h3>
                        <p className="text-xs text-text-muted mb-3">{a.description}</p>
                        <span className="flex items-center gap-1 w-fit px-2 py-0.5 bg-background border border-border rounded-full text-xs font-bold text-text-muted">
                          <Zap className="h-3 w-3" /> +{a.expReward} EXP
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {allAchievements?.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No achievements yet</h3>
            <p className="text-text-muted">Complete activities on TalentNest to unlock your first achievement!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
