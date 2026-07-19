import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Briefcase, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { api } from '@/lib/api';

const formatDate = (str: string) => {
  const d = new Date(str);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatCurrency = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;

export function AdminAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data,
  });

  const summaryCards = [
    { name: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
    { name: 'Active Contracts', value: stats?.activeContracts ?? '—', icon: Briefcase, color: 'text-success', bg: 'bg-success/10' },
    { name: 'Total Revenue', value: stats?.totalRevenue != null ? `$${Number(stats.totalRevenue).toLocaleString()}` : '—', icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
    { name: 'Total Contests', value: stats?.totalContests ?? '—', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  const rawAnalytics = Array.isArray(analytics) ? analytics : [];
  const chartData = rawAnalytics.slice(-14).map((d: any) => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Platform Analytics</h1>
        <p className="text-text-muted mt-1">Growth trends and key metrics over the last 30 days</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-surface border border-border/50 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted font-medium truncate">{card.name}</p>
              <p className="text-2xl font-bold text-text">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-text-muted">Loading analytics...</div>
      ) : (
        <>
          {/* User Registrations Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-surface border border-border/50 rounded-2xl p-6"
          >
            <h2 className="text-base font-semibold text-text mb-1">New Registrations</h2>
            <p className="text-xs text-text-muted mb-5">Daily new user sign-ups over the last 14 days</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#userGrad)" name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Contracts & Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-surface border border-border/50 rounded-2xl p-6"
          >
            <h2 className="text-base font-semibold text-text mb-1">Contracts & Revenue</h2>
            <p className="text-xs text-text-muted mb-5">Daily contracts created and revenue generated (last 14 days)</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="contractGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any) =>
                    value
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Area yAxisId="left" type="monotone" dataKey="contracts" stroke="#22c55e" strokeWidth={2} fill="url(#contractGrad)" name="Contracts" />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  );
}
