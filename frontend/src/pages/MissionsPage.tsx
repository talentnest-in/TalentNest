import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Target, CheckCircle2, Flame, Clock, Zap, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Mission {
  id: string; key: string; title: string; description: string; type: string;
  action: string; targetCount: number; expReward: number;
  startDate: string | null; endDate: string | null; isActive: boolean;
}

interface MissionProgress {
  id: string; userId: string; missionId: string; currentCount: number;
  completed: boolean; completedAt: string | null; startedAt: string; mission: Mission;
}
import React from 'react';

const TYPE_CONFIG: Record<string, { label: string; cardBg: string; badge: string; iconBg: string; icon: React.ReactNode }> = {
  DAILY: {
    label: '🔥 Daily',
    cardBg: 'bg-surface border-border hover:border-orange-200 hover:shadow-orange-50',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    iconBg: 'bg-orange-50 text-orange-500',
    icon: <Flame className="h-5 w-5 text-orange-500" />,
  },
  WEEKLY: {
    label: '📅 Weekly',
    cardBg: 'bg-surface border-border hover:border-purple-200 hover:shadow-purple-50',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-50 text-purple-500',
    icon: <Calendar className="h-5 w-5 text-purple-500" />,
  },
  SPECIAL: {
    label: '⭐ Special',
    cardBg: 'bg-surface border-border hover:border-amber-200 hover:shadow-amber-50',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-50 text-amber-500',
    icon: <Star className="h-5 w-5 text-amber-500" />,
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type?.toUpperCase()] || TYPE_CONFIG.SPECIAL;
}

function getTimeRemaining(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

function MissionCard({ mp, isProgress }: { mp: MissionProgress; isProgress: boolean }) {
  const config = getTypeConfig(mp.mission.type);
  const pct = Math.min(100, (mp.currentCount / mp.mission.targetCount) * 100);

  return (
    <div className={`relative border rounded-xl p-5 hover:shadow-lg transition-all ${config.cardBg}`}>
      {mp.completed && (
        <div className="absolute top-4 right-4">
          <span className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded-full border border-success/20">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${config.badge} mb-1.5 inline-block`}>
            {config.label}
          </span>
          <h3 className="font-semibold text-text text-sm">{mp.mission.title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{mp.mission.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent">
          <Zap className="h-3 w-3" /> +{mp.mission.expReward} EXP
        </span>
      </div>

      {isProgress && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-muted">Progress</span>
            <span className="text-text font-semibold">{mp.currentCount} / {mp.mission.targetCount}</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden border border-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-accent"
            />
          </div>
        </div>
      )}

      {mp.mission.endDate && !mp.completed && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>{getTimeRemaining(mp.mission.endDate)} remaining</span>
        </div>
      )}

      {mp.completed && mp.completedAt && (
        <p className="text-xs text-text-muted">
          Completed {new Date(mp.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  );
}

function AvailableMissionCard({ mission }: { mission: Mission }) {
  const config = getTypeConfig(mission.type);
  return (
    <div className={`border rounded-xl p-5 hover:shadow-lg transition-all ${config.cardBg}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${config.badge} mb-1.5 inline-block`}>
            {config.label}
          </span>
          <h3 className="font-semibold text-text text-sm">{mission.title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{mission.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent">
            <Zap className="h-3 w-3" /> +{mission.expReward} EXP
          </span>
          <span className="text-xs text-text-muted">{mission.targetCount} actions</span>
        </div>
        {mission.endDate && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3.5 w-3.5" />
            <span>{getTimeRemaining(mission.endDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MissionsPage() {
  const { data: userMissions, isLoading: loadingUser } = useQuery({
    queryKey: ['user-missions'],
    queryFn: () => api.get('/gamification/missions').then(res => res.data),
  });

  const { data: availableMissions, isLoading: loadingAll } = useQuery({
    queryKey: ['available-missions'],
    queryFn: () => api.get('/gamification/missions/available').then(res => res.data),
  });

  const isLoading = loadingUser || loadingAll;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeMissions = userMissions?.filter((m: MissionProgress) => !m.completed) || [];
  const completedMissions = userMissions?.filter((m: MissionProgress) => m.completed) || [];
  const availableMissionsList = availableMissions?.filter((m: Mission) =>
    m.isActive && !userMissions?.some((um: MissionProgress) => um.missionId === m.id)
  ) || [];

  const totalEXP = completedMissions.reduce((sum: number, m: MissionProgress) => sum + m.mission.expReward, 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Missions</h1>
          <p className="text-text-muted">Complete daily and weekly missions to earn bonus EXP and rewards.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: <Target className="h-6 w-6 text-accent" />, value: activeMissions.length, label: 'Active', bg: 'bg-accent/10' },
            { icon: <CheckCircle2 className="h-6 w-6 text-success" />, value: completedMissions.length, label: 'Completed', bg: 'bg-success/10' },
            { icon: <Zap className="h-6 w-6 text-primary" />, value: totalEXP, label: 'EXP Earned', bg: 'bg-primary/10' },
          ].map(({ icon, value, label, bg }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>
              <div>
                <p className="text-2xl font-bold text-text">{value}</p>
                <p className="text-sm text-text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Active Missions */}
        {activeMissions.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-text">Active Missions</h2>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-200">{activeMissions.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeMissions.map((mp: MissionProgress, i: number) => (
                <motion.div key={mp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <MissionCard mp={mp} isProgress={true} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Available Missions */}
        {availableMissionsList.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-text">Available Missions</h2>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">{availableMissionsList.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {availableMissionsList.map((mission: Mission, i: number) => (
                <motion.div key={mission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <AvailableMissionCard mission={mission} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Completed Missions */}
        {completedMissions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h2 className="text-xl font-semibold text-text">Completed</h2>
              <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-bold rounded-full border border-success/20">{completedMissions.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {completedMissions.map((mp: MissionProgress, i: number) => (
                <motion.div key={mp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <MissionCard mp={mp} isProgress={false} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {activeMissions.length === 0 && availableMissionsList.length === 0 && completedMissions.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No missions available</h3>
            <p className="text-text-muted">Missions will appear here soon. Check back later!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
