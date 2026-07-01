import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { OAuthCallback } from '@/pages/OAuthCallback';
import { ProtectedRoute, FreelancerRoute, ClientRoute } from '@/components/auth/ProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { ProfileManager } from '@/pages/ProfileManager';
import { ClientDashboard } from '@/pages/ClientDashboard';
import { CompanyPage } from '@/pages/CompanyPage';
import { ClientJobsPage } from '@/pages/ClientJobsPage';
import { CreateEditJobPage } from '@/pages/CreateEditJobPage';
import { OnboardingRoleSelection } from '@/pages/OnboardingRoleSelection';
import { FindJobs } from '@/pages/FindJobs';
import { JobDetails } from '@/pages/JobDetails';
import { SavedJobs } from '@/pages/SavedJobs';
import { MyApplications } from '@/pages/MyApplications';
import { ApplicationDetails } from '@/pages/ApplicationDetails';
import { ApplicantsList } from '@/pages/ApplicantsList';
import { ClientApplicants } from '@/pages/ClientApplicants';
import { ApplicantDetails } from '@/pages/ApplicantDetails';
import { ClientOffersList } from '@/pages/ClientOffersList';
import { OfferDetails } from '@/pages/OfferDetails';
import { FreelancerOffersList } from '@/pages/FreelancerOffersList';
import { ContractsList } from '@/pages/ContractsList';
import { ContractDetails } from '@/pages/ContractDetails';
import { ProjectWorkspace } from '@/pages/ProjectWorkspace';
import { Communications } from '@/pages/Communications';
import { ConversationDetail } from '@/pages/ConversationDetail';
import { AcademyMarketplace } from '@/pages/AcademyMarketplace';
import { AcademyCourseDetails } from '@/pages/AcademyCourseDetails';
import { AcademyMyLearning } from '@/pages/AcademyMyLearning';
import { AcademyLearning } from '@/pages/AcademyLearning';
import { AcademyCertificate } from '@/pages/AcademyCertificate';
import { AcademyCreator } from '@/pages/AcademyCreator';
import { AcademyCreatorCreate } from '@/pages/AcademyCreatorCreate';
import { AcademyCreatorCourse } from '@/pages/AcademyCreatorCourse';
import { AcademyCreatorAnalytics } from '@/pages/AcademyCreatorAnalytics';
import { AcademyBecomeCreator } from '@/pages/AcademyBecomeCreator';
import { AcademyMyCourses } from '@/pages/AcademyMyCourses';
import { AcademyCreatorProfile } from '@/pages/AcademyCreatorProfile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Protected routes (any authenticated user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding/select-role" element={<OnboardingRoleSelection />} />

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

          {/* ── Shared routes (both client and freelancer) ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/contracts" element={<ContractsList />} />
            <Route path="/contracts/:id" element={<ContractDetails />} />
            <Route path="/workspace/:id" element={<ProjectWorkspace />} />
            <Route path="/communications" element={<Communications />} />
            <Route path="/conversations/:id" element={<ConversationDetail />} />
            
            {/* ── Academy routes (shared) ── */}
            <Route path="/academy" element={<AcademyMarketplace />} />
            <Route path="/academy/course/:slug" element={<AcademyCourseDetails />} />
            <Route path="/academy/my-learning" element={<AcademyMyLearning />} />
            <Route path="/academy/learning/:courseId" element={<AcademyLearning />} />
            <Route path="/academy/certificate/:id" element={<AcademyCertificate />} />
            <Route path="/academy/become-creator" element={<AcademyBecomeCreator />} />
            <Route path="/academy/creator" element={<AcademyCreator />} />
            <Route path="/academy/creator/create" element={<AcademyCreatorCreate />} />
            <Route path="/academy/creator/my-courses" element={<AcademyMyCourses />} />
            <Route path="/academy/creator/course/:id" element={<AcademyCreatorCourse />} />
            <Route path="/academy/creator/analytics" element={<AcademyCreatorAnalytics />} />
            <Route path="/academy/creator/:id" element={<AcademyCreatorProfile />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
