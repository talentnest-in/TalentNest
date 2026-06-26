import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clientService } from '@/services/client.service';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/client/StatCard';
import { JobCard } from '@/components/client/JobCard';
import { CompanyCard } from '@/components/client/CompanyCard';
import { EmptyState } from '@/components/client/EmptyState';
import {
  Briefcase, Building2, LayoutDashboard, Settings, LogOut,
  Plus, Bell, TrendingUp, FileText, CheckCircle,
} from 'lucide-react';

export function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: clientService.getDashboard,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/client-dashboard' },
    { icon: Briefcase, label: 'Jobs', path: '/client/jobs' },
    { icon: Building2, label: 'Company', path: '/company' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary text-white px-4 py-6">
        <div className="px-2 mb-10">
          <Logo className="h-8" withText />
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => (
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
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? 'Client'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors" title="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
            <p className="text-sm text-text-muted">Here's your hiring overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/jobs/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Post a Job
            </Button>
            <button className="h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-border/30">
              <Bell className="h-5 w-5 text-text-muted" />
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-surface border border-border rounded-2xl p-6 h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard icon={TrendingUp} label="Active Jobs" value={data?.activeJobs ?? 0} color="bg-accent" subtitle="Currently hiring" />
                <StatCard icon={FileText} label="Draft Jobs" value={data?.draftJobs ?? 0} color="bg-[#8B5CF6]" subtitle="Not published yet" />
                <StatCard icon={Briefcase} label="Total Jobs" value={data?.totalJobs ?? 0} color="bg-primary" subtitle="All time" />
                <StatCard icon={CheckCircle} label="Closed / Paused" value={data?.closedJobs ?? 0} color="bg-success" subtitle="Completed or on hold" />
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Jobs */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text">Recent Jobs</h2>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/client/jobs')}>View All</Button>
                  </div>
                  {(data?.recentJobs?.length ?? 0) > 0 ? (
                    <div className="space-y-4">
                      {data?.recentJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Briefcase}
                      title="No jobs yet"
                      description="Post your first job to start hiring talented freelancers."
                      actionLabel="Post a Job"
                      onAction={() => navigate('/jobs/new')}
                    />
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {data?.company ? (
                    <CompanyCard company={data.company} />
                  ) : (
                    <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                      <Building2 className="w-10 h-10 text-text-muted mx-auto mb-3" />
                      <p className="font-semibold text-text mb-1">No company yet</p>
                      <p className="text-sm text-text-muted mb-4">Set up your company profile to appear professional to freelancers.</p>
                      <Button variant="outline" className="w-full" onClick={() => navigate('/company')}>
                        Setup Company
                      </Button>
                    </div>
                  )}
                  {/* Quick Actions */}
                  <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                    <h3 className="font-semibold text-text">Quick Actions</h3>
                    <Button className="w-full justify-start gap-2" onClick={() => navigate('/jobs/new')}>
                      <Plus className="w-4 h-4" /> Post New Job
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/client/jobs')}>
                      <Briefcase className="w-4 h-4" /> Manage Jobs
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/company')}>
                      <Building2 className="w-4 h-4" /> Edit Company
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
