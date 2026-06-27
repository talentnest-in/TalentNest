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
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
