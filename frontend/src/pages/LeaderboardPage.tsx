import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Crown, Trophy, Medal, TrendingUp, Calendar, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  userId: string;
  period: string;
  category: string;
  exp: number;
  rank: number;
  user: { id: string; name: string; avatar: string | null; role: string; };
}

const PODIUM_CONFIG = [
  { rankLabel: '2nd', height: 'h-28', icon: <Medal className="h-6 w-6 text-gray-400" />, bg: 'bg-gray-50 border-gray-200', textColor: 'text-gray-600', avatarRing: 'ring-gray-300' },
  { rankLabel: '1st', height: 'h-40', icon: <Crown className="h-7 w-7 text-accent" />, bg: 'bg-accent/5 border-accent/30', textColor: 'text-accent', avatarRing: 'ring-accent' },
  { rankLabel: '3rd', height: 'h-20', icon: <Trophy className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50 border-amber-200', textColor: 'text-amber-600', avatarRing: 'ring-amber-400' },
];

// 2nd left, 1st center, 3rd right
const PODIUM_ORDER = [1, 0, 2];

export function LeaderboardPage() {
  const [period, setPeriod] = useState('ALL_TIME');
  const [category, setCategory] = useState('COMMUNITY');
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', period, category],
    queryFn: () => api.get('/gamification/leaderboard', { params: { period, category } }).then(res => res.data),
  });

  const periods = [
    { value: 'ALL_TIME', label: 'All Time' },
    { value: 'WEEKLY', label: 'This Week' },
    { value: 'MONTHLY', label: 'This Month' },
  ];

  const categories = [
    { value: 'COMMUNITY', label: 'Community' },
    { value: 'FREELANCER', label: 'Freelancer' },
    { value: 'CREATOR', label: 'Creator' },
    { value: 'LEARNER', label: 'Learner' },
    { value: 'CONTEST', label: 'Contest' },
  ];

  const topThree = leaderboard?.slice(0, 3) || [];
  const remaining = leaderboard?.slice(3) || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="h-12 bg-gray-200 rounded w-full mb-6" />
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Leaderboard</h1>
          <p className="text-text-muted">See how you rank among the top performers on TalentNest.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-text-muted" />
            <div className="flex bg-background border border-border rounded-xl p-1 gap-1">
              {periods.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    period === p.value ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-text-muted" />
            <div className="flex bg-background border border-border rounded-xl p-1 gap-1 flex-wrap">
              {categories.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    category === c.value ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Podium */}
        {topThree.length > 0 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {PODIUM_ORDER.map((entryIdx, podiumIdx) => {
              const entry = topThree[entryIdx];
              if (!entry) return null;
              const config = PODIUM_CONFIG[podiumIdx];
              const isMe = entry.userId === user?.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: podiumIdx * 0.12, duration: 0.4, type: 'spring' }}
                  className="flex flex-col items-center"
                >
                  <div className="text-center mb-3">
                    <div className="flex justify-center mb-2">{config.icon}</div>
                    <div className={`h-14 w-14 rounded-full ring-2 ${config.avatarRing} ${isMe ? 'ring-4' : ''} overflow-hidden bg-gray-100 flex items-center justify-center mx-auto mb-2`}>
                      {entry.user.avatar ? (
                        <img src={entry.user.avatar} alt={entry.user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className={`text-lg font-bold ${config.textColor}`}>
                          {entry.user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-bold ${isMe ? 'text-accent' : 'text-text'} max-w-[110px] truncate text-center`}>
                      {isMe ? 'You' : entry.user.name}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Zap className={`h-3 w-3 ${config.textColor}`} />
                      <span className={`text-xs font-semibold ${config.textColor}`}>{entry.exp} EXP</span>
                    </div>
                  </div>

                  <div className={`w-32 ${config.height} ${config.bg} border rounded-t-2xl flex items-start justify-center pt-3`}>
                    <span className={`text-3xl font-black ${config.textColor}`}>
                      {podiumIdx === 1 ? '1' : podiumIdx === 0 ? '2' : '3'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Table */}
        {remaining.length > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text">Role</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text">EXP</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {remaining.map((entry, i) => {
                      const isMe = entry.userId === user?.id;
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`border-b border-border hover:bg-background/50 transition-colors ${isMe ? 'bg-accent/5 border-l-2 border-l-accent' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-text-muted">#{entry.rank}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {entry.user.avatar ? (
                                  <img src={entry.user.avatar} alt={entry.user.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-sm font-bold text-text-muted">
                                    {entry.user.name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                              <span className={`text-sm font-medium ${isMe ? 'text-accent font-semibold' : 'text-text'}`}>
                                {isMe ? 'You' : entry.user.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {entry.user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Zap className="h-3.5 w-3.5 text-accent" />
                              <span className="text-sm font-bold text-text">{entry.exp}</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {leaderboard?.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No leaderboard data yet</h3>
            <p className="text-text-muted">Start completing activities to earn EXP and climb the leaderboard!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
