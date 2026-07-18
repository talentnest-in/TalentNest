import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { TrendingUp, Zap, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface ExperienceLog {
  id: string; userId: string; amount: number; action: string; description: string; createdAt: string;
}

const ACTION_ICONS: Record<string, string> = {
  PROFILE_COMPLETE: '👤',
  DAILY_LOGIN: '📅',
  JOB_APPLICATION: '💼',
  CONTRACT_COMPLETE: '📝',
  FIVE_STAR_REVIEW: '⭐',
  COURSE_COMPLETE: '🎓',
  COURSE_PUBLISH: '📚',
  COMMUNITY_POST: '💬',
  ACHIEVEMENT_BONUS: '🏆',
  MISSION_COMPLETE: '🎯',
  LEVEL_UP: '🚀',
  DEFAULT: '✨',
};

export function ExpHistoryPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: response, isLoading } = useQuery({
    queryKey: ['exp-history', page],
    queryFn: () => api.get('/gamification/exp-history', { params: { page, limit } }).then(res => res.data),
  });

  const logs = response?.logs || [];
  const pagination = response?.pagination || { page: 1, limit, total: 0, pages: 0 };
  const totalPages = pagination.pages;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Experience History</h1>
          <p className="text-text-muted">Track all the experience points you've earned on TalentNest.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Filter className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{pagination.total}</p>
              <p className="text-sm text-text-muted">Total Activities</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {isLoading ? '—' : logs.reduce((s: number, l: ExperienceLog) => s + l.amount, 0)}
              </p>
              <p className="text-sm text-text-muted">EXP This Page</p>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Recent Activity</h2>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <TrendingUp className="h-4 w-4" />
              <span>Page {pagination.page} of {totalPages || 1}</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="px-4 py-4 flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              ))
            ) : (
              <AnimatePresence>
                {logs.map((log: ExperienceLog, i: number) => {
                  const emoji = ACTION_ICONS[log.action] || ACTION_ICONS.DEFAULT;
                  const isPositive = log.amount > 0;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="px-4 py-4 flex items-center gap-4 hover:bg-background/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0 text-lg">
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{log.description}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {log.action} · {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                        isPositive
                          ? 'bg-success/10 border border-success/20 text-success'
                          : 'bg-error/10 border border-error/20 text-error'
                      }`}>
                        <Zap className="h-3 w-3" />
                        {isPositive ? '+' : ''}{log.amount}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm text-text disabled:opacity-50 hover:bg-background/80 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm text-text disabled:opacity-50 hover:bg-background/80 transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && logs.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No activity yet</h3>
            <p className="text-text-muted">Start completing activities on TalentNest to earn experience points!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
