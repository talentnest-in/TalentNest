import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ── Lazy-load all pages for code splitting ──────────────────────────────────
// Auth / Onboarding
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('@/pages/Signup').then(m => ({ default: m.Signup })));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })));
const OnboardingWizard = lazy(() => import('@/pages/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));

// Freelancer
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ProfileManager = lazy(() => import('@/pages/ProfileManager').then(m => ({ default: m.ProfileManager })));
const FindJobs = lazy(() => import('@/pages/FindJobs').then(m => ({ default: m.FindJobs })));
const JobDetails = lazy(() => import('@/pages/JobDetails').then(m => ({ default: m.JobDetails })));
const SavedJobs = lazy(() => import('@/pages/SavedJobs').then(m => ({ default: m.SavedJobs })));
const MyApplications = lazy(() => import('@/pages/MyApplications').then(m => ({ default: m.MyApplications })));
const ApplicationDetails = lazy(() => import('@/pages/ApplicationDetails').then(m => ({ default: m.ApplicationDetails })));
const FreelancerOffersList = lazy(() => import('@/pages/FreelancerOffersList').then(m => ({ default: m.FreelancerOffersList })));

// Client
const ClientDashboard = lazy(() => import('@/pages/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
const CompanyPage = lazy(() => import('@/pages/CompanyPage').then(m => ({ default: m.CompanyPage })));
const ClientJobsPage = lazy(() => import('@/pages/ClientJobsPage').then(m => ({ default: m.ClientJobsPage })));
const CreateEditJobPage = lazy(() => import('@/pages/CreateEditJobPage').then(m => ({ default: m.CreateEditJobPage })));
const ApplicantsList = lazy(() => import('@/pages/ApplicantsList').then(m => ({ default: m.ApplicantsList })));
const ClientApplicants = lazy(() => import('@/pages/ClientApplicants').then(m => ({ default: m.ClientApplicants })));
const ApplicantDetails = lazy(() => import('@/pages/ApplicantDetails').then(m => ({ default: m.ApplicantDetails })));
const ClientOffersList = lazy(() => import('@/pages/ClientOffersList').then(m => ({ default: m.ClientOffersList })));

// Shared
const OfferDetails = lazy(() => import('@/pages/OfferDetails').then(m => ({ default: m.OfferDetails })));
const ContractsList = lazy(() => import('@/pages/ContractsList').then(m => ({ default: m.ContractsList })));
const ContractDetails = lazy(() => import('@/pages/ContractDetails').then(m => ({ default: m.ContractDetails })));
const ProjectWorkspace = lazy(() => import('@/pages/ProjectWorkspace').then(m => ({ default: m.ProjectWorkspace })));
const Communications = lazy(() => import('@/pages/Communications').then(m => ({ default: m.Communications })));
const ConversationDetail = lazy(() => import('@/pages/ConversationDetail').then(m => ({ default: m.ConversationDetail })));
const Notifications = lazy(() => import('@/pages/Notifications').then(m => ({ default: m.Notifications })));

// Academy
const AcademyMarketplace = lazy(() => import('@/pages/AcademyMarketplace').then(m => ({ default: m.AcademyMarketplace })));
const AcademyCourseDetails = lazy(() => import('@/pages/AcademyCourseDetails').then(m => ({ default: m.AcademyCourseDetails })));
const AcademyMyLearning = lazy(() => import('@/pages/AcademyMyLearning').then(m => ({ default: m.AcademyMyLearning })));
const AcademyLearning = lazy(() => import('@/pages/AcademyLearning').then(m => ({ default: m.AcademyLearning })));
const AcademyCertificate = lazy(() => import('@/pages/AcademyCertificate').then(m => ({ default: m.AcademyCertificate })));
const AcademyCreator = lazy(() => import('@/pages/AcademyCreator').then(m => ({ default: m.AcademyCreator })));
const AcademyCreatorCreate = lazy(() => import('@/pages/AcademyCreatorCreate').then(m => ({ default: m.AcademyCreatorCreate })));
const AcademyCreatorCourse = lazy(() => import('@/pages/AcademyCreatorCourse').then(m => ({ default: m.AcademyCreatorCourse })));
const AcademyCreatorAnalytics = lazy(() => import('@/pages/AcademyCreatorAnalytics').then(m => ({ default: m.AcademyCreatorAnalytics })));
const AcademyBecomeCreator = lazy(() => import('@/pages/AcademyBecomeCreator').then(m => ({ default: m.AcademyBecomeCreator })));
const AcademyMyCourses = lazy(() => import('@/pages/AcademyMyCourses').then(m => ({ default: m.AcademyMyCourses })));
const AcademyCreatorProfile = lazy(() => import('@/pages/AcademyCreatorProfile').then(m => ({ default: m.AcademyCreatorProfile })));

// Community
const CommunityFeed = lazy(() => import('@/pages/community/CommunityFeed').then(m => ({ default: m.CommunityFeed })));
const CommunityDetail = lazy(() => import('@/pages/community/CommunityDetail').then(m => ({ default: m.CommunityDetail })));
const CreateCommunity = lazy(() => import('@/pages/community/CreateCommunity').then(m => ({ default: m.CreateCommunity })));
const PostDetail = lazy(() => import('@/pages/community/PostDetail').then(m => ({ default: m.PostDetail })));

// Contest Hub
const ContestMarketplace = lazy(() => import('@/pages/contest/ContestMarketplace').then(m => ({ default: m.ContestMarketplace })));
const ContestDetail = lazy(() => import('@/pages/contest/ContestDetail').then(m => ({ default: m.ContestDetail })));
const CreateContest = lazy(() => import('@/pages/contest/CreateContest').then(m => ({ default: m.CreateContest })));
const ClientContestDashboard = lazy(() => import('@/pages/contest/ClientContestDashboard').then(m => ({ default: m.ClientContestDashboard })));
const ContestSubmissions = lazy(() => import('@/pages/contest/ContestSubmissions').then(m => ({ default: m.ContestSubmissions })));
const FreelancerContestDashboard = lazy(() => import('@/pages/contest/FreelancerContestDashboard').then(m => ({ default: m.FreelancerContestDashboard })));

// Gamification
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage').then(m => ({ default: m.AchievementsPage })));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const MissionsPage = lazy(() => import('@/pages/MissionsPage').then(m => ({ default: m.MissionsPage })));
const ExpHistoryPage = lazy(() => import('@/pages/ExpHistoryPage').then(m => ({ default: m.ExpHistoryPage })));

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminModeration = lazy(() => import('@/pages/admin/AdminModeration').then(m => ({ default: m.AdminModeration })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminFinance = lazy(() => import('@/pages/admin/AdminFinance').then(m => ({ default: m.AdminFinance })));
const AdminCommunication = lazy(() => import('@/pages/admin/AdminCommunication').then(m => ({ default: m.AdminCommunication })));
const AdminGamification = lazy(() => import('@/pages/admin/AdminGamification').then(m => ({ default: m.AdminGamification })));
import { AdminLayout } from '@/components/layout/AdminLayout';

// Protected route components (not lazy — tiny, needed immediately)
import { ProtectedRoute, FreelancerRoute, ClientRoute, AdminRoute } from '@/components/auth/ProtectedRoute';

// ── Page Loader fallback ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-accent animate-spin" />
        <span className="text-sm text-text-muted font-medium">Loading...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/certificate/verify/:code" element={<AcademyCertificate />} />

          {/* Protected routes (any authenticated user) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingWizard />} />

            {/* ── Freelancer-only routes ── */}
            <Route element={<FreelancerRoute />}>
              <Route path="/freelancer-dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfileManager />} />
              <Route path="/find-jobs" element={<FindJobs />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/saved-jobs" element={<SavedJobs />} />
              <Route path="/applications" element={<MyApplications />} />
              <Route path="/applications/:id" element={<ApplicationDetails />} />
              <Route path="/freelancer/offers" element={<FreelancerOffersList />} />
              <Route path="/freelancer/offers/:id" element={<OfferDetails />} />
            </Route>

            {/* ── Client-only routes ── */}
            <Route element={<ClientRoute />}>
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="/client/jobs" element={<ClientJobsPage />} />
              <Route path="/company" element={<CompanyPage />} />
              <Route path="/jobs/new" element={<CreateEditJobPage />} />
              <Route path="/jobs/:id/edit" element={<CreateEditJobPage />} />
              <Route path="/client/applicants" element={<ClientApplicants />} />
              <Route path="/client/jobs/:jobId/applicants" element={<ApplicantsList />} />
              <Route path="/client/applicants/:id" element={<ApplicantDetails />} />
              <Route path="/client/offers" element={<ClientOffersList />} />
              <Route path="/client/offers/:id" element={<OfferDetails />} />
            </Route>

            {/* ── Admin-only routes ── */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/finance" element={<AdminFinance />} />
                <Route path="/admin/communication" element={<AdminCommunication />} />
                <Route path="/admin/gamification" element={<AdminGamification />} />
              </Route>
            </Route>

            {/* ── Shared routes (both client and freelancer) ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/contracts" element={<ContractsList />} />
              <Route path="/contracts/:id" element={<ContractDetails />} />
              <Route path="/workspace/:id" element={<ProjectWorkspace />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/conversations/:id" element={<ConversationDetail />} />
              <Route path="/notifications" element={<Notifications />} />

              {/* ── Academy routes (shared) ── */}
              <Route path="/academy" element={<AcademyMarketplace />} />
              <Route path="/academy/course/:slug" element={<AcademyCourseDetails />} />
              <Route path="/academy/my-learning" element={<AcademyMyLearning />} />
              <Route path="/academy/learning/:courseId" element={<AcademyLearning />} />
              <Route path="/academy/become-creator" element={<AcademyBecomeCreator />} />
              <Route path="/academy/creator" element={<AcademyCreator />} />
              <Route path="/academy/creator/create" element={<AcademyCreatorCreate />} />
              <Route path="/academy/creator/my-courses" element={<AcademyMyCourses />} />
              <Route path="/academy/creator/course/:id" element={<AcademyCreatorCourse />} />
              <Route path="/academy/creator/analytics" element={<AcademyCreatorAnalytics />} />
              <Route path="/academy/creator/:id" element={<AcademyCreatorProfile />} />

              {/* ── Community routes (shared) ── */}
              <Route path="/community" element={<CommunityFeed />} />
              <Route path="/community/create" element={<CreateCommunity />} />
              <Route path="/community/:slug" element={<CommunityDetail />} />
              <Route path="/community/post/:id" element={<PostDetail />} />

              {/* ── Contest Hub routes (shared) ── */}
              <Route path="/contests" element={<ContestMarketplace />} />
              <Route path="/contests/create" element={<CreateContest />} />
              <Route path="/contests/manage" element={<ClientContestDashboard />} />
              <Route path="/contests/my" element={<FreelancerContestDashboard />} />
              <Route path="/contests/:id/submissions" element={<ContestSubmissions />} />
              <Route path="/contests/:slug" element={<ContestDetail />} />

              {/* ── Gamification routes (shared) ── */}
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/missions" element={<MissionsPage />} />
              <Route path="/exp-history" element={<ExpHistoryPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
