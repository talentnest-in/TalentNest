import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Briefcase, DollarSign, BookOpen, Trophy, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  });

  const statCards = [
    { name: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-accent', bg: 'bg-accent/10', href: '/admin/users' },
    { name: 'Active Contracts', value: stats?.activeContracts ?? '—', icon: Briefcase, color: 'text-success', bg: 'bg-success/10', href: null },
    { name: 'Total Revenue', value: stats?.totalRevenue != null ? `$${Number(stats.totalRevenue).toLocaleString()}` : '—', icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10', href: '/admin/analytics' },
    { name: 'Published Courses', value: stats?.totalCourses ?? '—', icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10', href: null },
    { name: 'Total Contests', value: stats?.totalContests ?? '—', icon: Trophy, color: 'text-accent', bg: 'bg-accent/10', href: '/admin/moderation' },
    { name: 'Pending Review', value: stats?.pendingCourses ?? '—', icon: AlertCircle, color: 'text-error', bg: 'bg-error/10', href: '/admin/moderation' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
        <p className="text-text-muted mt-1">Platform overview and quick links</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border/50 rounded-2xl p-6 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, idx) => {
            const card = (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className={`bg-surface border border-border/50 rounded-2xl p-5 flex items-center gap-4 ${stat.href ? 'hover:border-accent/40 transition-colors cursor-pointer' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted font-medium truncate">{stat.name}</p>
                  <p className="text-2xl font-bold text-text">{stat.value}</p>
                </div>
              </motion.div>
            );
            return stat.href ? <Link key={stat.name} to={stat.href}>{card}</Link> : <div key={stat.name}>{card}</div>;
          })}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
        {[
          { href: '/admin/analytics', title: '📊 Analytics', desc: 'View growth charts and trends' },
          { href: '/admin/users', title: '👥 User Management', desc: 'Search, promote, or remove users' },
          { href: '/admin/moderation', title: '🛡 Moderation', desc: 'Review reports, courses, and contests' },
          { href: '/admin/settings', title: '⚙️ Settings', desc: 'Configure global platform rules and fees' },
        ].map((link, idx) => (
          <Link key={link.href} to={link.href}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.08 }}
              className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-accent/40 hover:bg-accent/5 transition-all group"
            >
              <p className="font-semibold text-text group-hover:text-accent transition-colors">{link.title}</p>
              <p className="text-sm text-text-muted mt-1">{link.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
