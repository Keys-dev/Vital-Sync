import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import ProtectedRoute     from '@/components/ProtectedRoutes';
import Layout             from '@/components/Layout';
import AuthPage           from '@/pages/AuthPage';
import Onboarding         from '@/pages/Onboarding';

// Existing doctor pages (keep using mock data for now)
import Dashboard    from '@/pages/Dashboard';
import PatientList  from '@/pages/PatientList';
import HealthTrends from '@/pages/HealthTrends';
import Alerts       from '@/pages/Alerts';
import GPSTracker   from '@/pages/GPSTracker';
import Settings     from '@/pages/Settings';

// New doctor pages
import AccessRequests from '@/pages/doctor/AccessRequests';
import PatientVitals  from '@/pages/doctor/PatientVitals';

// New family pages
import FamilyLayout    from '@/layouts/FamilyLayout';
import FamilyDashboard from '@/pages/family/FamilyDashboard';
import FamilyPatient   from '@/pages/family/FamilyPatient';

const clerkAppearance = {
  variables: {
    colorPrimary:         '#0086a8',
    colorBackground:      '#ffffff',
    colorText:            '#0d1f2d',
    colorInputBackground: '#e8eef4',
    colorInputText:       '#0d1f2d',
    borderRadius:         '12px',
  },
};

function ClerkPage({ Component }: { Component: typeof SignIn | typeof SignUp }) {
  return (
    <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center px-4">
      <Component
        routing="path"
        path={Component === SignIn ? '/sign-in' : '/sign-up'}
        afterSignInUrl="/onboarding"
        afterSignUpUrl="/onboarding"
        appearance={clerkAppearance}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/auth"      element={<AuthPage />} />
        <Route path="/"          element={<Navigate to="/auth" replace />} />
        <Route path="/sign-in/*" element={<ClerkPage Component={SignIn} />} />
        <Route path="/sign-up/*" element={<ClerkPage Component={SignUp} />} />

        <Route path="/unauthorized" element={
          <div className="min-h-screen bg-bg-base flex items-center justify-center">
            <p className="text-status-critical font-mono text-sm">Access denied.</p>
          </div>
        } />

        {/* Onboarding — any signed-in user without a profile row yet */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        {/* Doctor routes */}
        <Route element={<ProtectedRoute requiredRole="doctor" />}>
          <Route path="/" element={<Layout />}>
            <Route path="dashboard"               element={<Dashboard />} />
            <Route path="patients"                element={<PatientList />} />
            <Route path="trends"                  element={<HealthTrends />} />
            <Route path="alerts"                  element={<Alerts />} />
            <Route path="gps"                     element={<GPSTracker />} />
            <Route path="settings"                element={<Settings />} />
            <Route path="requests"                element={<AccessRequests />} />
            <Route path="patient/:patientId/live" element={<PatientVitals />} />
          </Route>
        </Route>

        {/* Family routes */}
        <Route element={<ProtectedRoute requiredRole="family" />}>
          <Route path="/family" element={<FamilyLayout />}>
            <Route index                      element={<FamilyDashboard />} />
            <Route path="patient/:patientId"  element={<FamilyPatient />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}