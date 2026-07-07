import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { applicationService } from '@/services/application.service';
import { offerService } from '@/services/offer.service';
import { contractService } from '@/services/contract.service';
import { enrollmentService, courseService } from '@/services/academy.service';
import {
  Briefcase,
  MessageSquare,
  Bell,
  Settings,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  ChevronRight,
  User,
  FileText,
  BookOpen,
  Play,
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationService.getMyApplications(),
  });

  const { data: offersData } = useQuery({
    queryKey: ['freelancerOffers'],
    queryFn: () => offerService.getFreelancerOffers(),
  });

  const { data: contractsData } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractService.getContracts(),
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => enrollmentService.getUserEnrollments({ status: 'ACTIVE' }),
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAllCourses({ limit: 4, sortBy: 'rating', sortOrder: 'desc' }),
  });

  const applications = applicationsData?.applications || [];
  const offers = offersData?.offers || [];
  const contracts = contractsData?.contracts || [];
  const enrollments = enrollmentsData || [];
  const recommendedCourses = coursesData?.courses || [];

  // Calculate application stats
  const totalApplications = applications.length;

  // Calculate offer stats
  const pendingOffers = offers.filter(o => o.status === 'PENDING').length;

  // Calculate contract stats
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const completedContracts = contracts.filter(c => c.status === 'COMPLETED').length;

  const navItems = [
    { icon: TrendingUp, label: 'Dashboard', path: '/freelancer-dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Briefcase, label: 'Find Jobs', path: '/find-jobs' },
    { icon: Users, label: 'Applications', path: '/applications' },
    { icon: DollarSign, label: 'Offers', path: '/freelancer/offers' },
    { icon: FileText, label: 'Contracts', path: '/contracts' },
    { icon: BookOpen, label: 'Academy', path: '/academy' },
    { icon: Bell, label: 'Saved Jobs', path: '/saved-jobs' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border/50 px-6 py-4 flex items-center justify-between -mx-6 -mt-6 mb-8">
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

      <div className="space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={Users} label="Total Applications" value={totalApplications.toString()} color="bg-accent" />
            <StatCard icon={TrendingUp} label="Pending Offers" value={pendingOffers.toString()} color="bg-orange-500" />
            <StatCard icon={FileText} label="Active Contracts" value={activeContracts.toString()} color="bg-primary" />
            <StatCard icon={DollarSign} label="Completed Contracts" value={completedContracts.toString()} color="bg-success" />
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

          {/* Academy Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Continue Learning */}
            {enrollments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface border border-border/50 rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-heading font-semibold text-text">Continue Learning</h2>
                  <button
                    onClick={() => navigate('/academy/my-learning')}
                    className="text-sm text-accent hover:text-accent/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {enrollments.slice(0, 3).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      onClick={() => navigate(`/academy/learning/${enrollment.course.id}`)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-border/30 cursor-pointer transition-colors"
                    >
                      <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {enrollment.course.thumbnail ? (
                          <img
                            src={enrollment.course.thumbnail}
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{enrollment.course.title}</p>
                        <p className="text-xs text-text-muted">{enrollment.course.creator.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                            <div
                              className="h-1.5 bg-accent rounded-full"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted">{(enrollment.progress || 0).toFixed(0)}%</span>
                        </div>
                      </div>
                      <Play className="h-5 w-5 text-accent flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recommended Courses */}
            {recommendedCourses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-surface border border-border/50 rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-heading font-semibold text-text">Recommended Courses</h2>
                  <button
                    onClick={() => navigate('/academy')}
                    className="text-sm text-accent hover:text-accent/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {recommendedCourses.slice(0, 3).map((course) => (
                    <div
                      key={course.id}
                      onClick={() => navigate(`/academy/course/${course.slug}`)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-border/30 cursor-pointer transition-colors"
                    >
                      <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{course.title}</p>
                        <p className="text-xs text-text-muted">{course.level}</p>
                        <p className="text-sm font-semibold text-accent">${(course.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
      </div>
    </DashboardLayout>
  );
}
