import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clientService } from '@/services/client.service';
import { offerService } from '@/services/offer.service';
import { contractService } from '@/services/contract.service';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/client/StatCard';
import { JobCard } from '@/components/client/JobCard';
import { CompanyCard } from '@/components/client/CompanyCard';
import { EmptyState } from '@/components/client/EmptyState';
import {
  Briefcase, Building2, LayoutDashboard, Settings,
  Plus, Bell, TrendingUp, FileText, CheckCircle, Users, DollarSign,
} from 'lucide-react';

export function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: clientService.getDashboard,
  });

  const { data: offersData } = useQuery({
    queryKey: ['clientOffers'],
    queryFn: () => offerService.getClientOffers(),
  });

  const { data: contractsData } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractService.getContracts(),
  });

  const offers = offersData?.offers || [];
  const contracts = contractsData?.contracts || [];

  // Calculate offer stats
  const pendingOffers = offers.filter(o => o.status === 'PENDING').length;

  // Calculate contract stats
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const completedContracts = contracts.filter(c => c.status === 'COMPLETED').length;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/client-dashboard' },
    { icon: Briefcase, label: 'Jobs', path: '/client/jobs' },
    { icon: Users, label: 'Applicants', path: '/client/applicants' },
    { icon: DollarSign, label: 'Offers', path: '/client/offers' },
    { icon: FileText, label: 'Contracts', path: '/contracts' },
    { icon: Building2, label: 'Company', path: '/company' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border/50 px-6 py-4 flex items-center justify-between -mx-6 -mt-6 mb-8">
        <div>
          <h1 className="text-xl font-heading font-bold text-text">Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
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

      <div className="space-y-8">
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
                <StatCard icon={DollarSign} label="Pending Offers" value={pendingOffers.toString()} color="bg-warning" subtitle="Awaiting response" />
                <StatCard icon={FileText} label="Active Contracts" value={activeContracts.toString()} color="bg-primary" subtitle="In progress" />
                <StatCard icon={CheckCircle} label="Completed Contracts" value={completedContracts.toString()} color="bg-success" subtitle="Successfully completed" />
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
    </DashboardLayout>
  );
}
