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
          </Route>

          {/* ── Client-only routes ── */}
          <Route element={<ClientRoute />}>
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/client/jobs" element={<ClientJobsPage />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/jobs/new" element={<CreateEditJobPage />} />
            <Route path="/jobs/:id/edit" element={<CreateEditJobPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
