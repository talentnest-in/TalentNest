import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { applicationService } from '@/services/application.service';
import {
  Briefcase,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  ChevronRight,
  User,
} from 'lucide-react';

/* ─── Stat Card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border/50 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-heading font-bold text-text">{value}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </motion.div>
  );
}

/* ─── Activity Row ─── */
function ActivityRow({
  title,
  subtitle,
  time,
}: {
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
      <span className="text-xs text-text-muted whitespace-nowrap">{time}</span>
    </div>
  );
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationService.getMyApplications(),
  });

  const applications = applicationsData?.applications || [];

  // Calculate application stats
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(a => a.status === 'PENDING').length;
  const shortlistedApplications = applications.filter(a => a.status === 'SHORTLISTED').length;
  const hiredApplications = applications.filter(a => a.status === 'HIRED').length;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary text-white px-4 py-6">
        <div className="px-2 mb-10">
          <Logo className="h-8" withText />
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { icon: TrendingUp, label: 'Dashboard', path: '/freelancer-dashboard' },
            { icon: User, label: 'Profile', path: '/profile' },
            { icon: Briefcase, label: 'Find Jobs', path: '/find-jobs' },
            { icon: Users, label: 'Applications', path: '/applications' },
            { icon: DollarSign, label: 'Saved Jobs', path: '/saved-jobs' },
            { icon: MessageSquare, label: 'Messages', path: '/messages' },
            { icon: Bell, label: 'Notifications', path: '/notifications' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                window.location.pathname === path
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? 'User'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-white transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-bold text-text">
              Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <p className="text-sm text-text-muted">Here's what's happening with your account today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search…"
                className="h-10 w-60 rounded-xl border border-border bg-background pl-10 pr-4 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
              />
            </div>
            <button className="relative h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-border/30 transition-colors">
              <Bell className="h-5 w-5 text-text-muted" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[10px] text-white font-bold flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={Users} label="Total Applications" value={totalApplications.toString()} color="bg-accent" />
            <StatCard icon={TrendingUp} label="Pending" value={pendingApplications.toString()} color="bg-yellow-500" />
            <StatCard icon={Briefcase} label="Shortlisted" value={shortlistedApplications.toString()} color="bg-purple-500" />
            <StatCard icon={DollarSign} label="Hired" value={hiredApplications.toString()} color="bg-success" />
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-surface border border-border/50 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <h2 className="text-lg font-heading font-semibold text-text">Recent Activity</h2>
                <button className="text-sm text-accent hover:text-accent/80 font-medium flex items-center gap-1 transition-colors">
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 pb-6">
                <ActivityRow
                  title="Application submitted"
                  subtitle="Senior React Developer at TechCorp"
                  time="2 hours ago"
                />
                <ActivityRow
                  title="New message received"
                  subtitle="Sarah from DesignStudio"
                  time="5 hours ago"
                />
                <ActivityRow
                  title="Job posted"
                  subtitle="Full-Stack Engineer — Remote"
                  time="1 day ago"
                />
                <ActivityRow
                  title="Profile viewed"
                  subtitle="by a recruiter at InnovateCo"
                  time="2 days ago"
                />
                <ActivityRow
                  title="Contract completed"
                  subtitle="Landing page for StartupXYZ"
                  time="3 days ago"
                />
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-border/50 rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-lg font-heading font-semibold text-text mb-5">Quick Actions</h2>
              <div className="space-y-3">
                <Button variant="accent" className="w-full justify-start gap-3 font-medium">
                  <Briefcase className="h-4 w-4" />
                  Post a New Job
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 font-medium">
                  <Search className="h-4 w-4" />
                  Browse Freelancers
                </Button>
                <Button variant="outline" onClick={() => navigate('/profile')} className="w-full justify-start gap-3 font-medium">
                  <User className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Open Messages
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
