import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute  from '@/components/ProtectedRoutes';
import Layout          from '@/components/Layout';
import AuthPage        from '@/pages/AuthPage';

import Dashboard    from '@/pages/Dashboard';
import PatientList  from '@/pages/PatientList';
import HealthTrends from '@/pages/HealthTrends';
import Alerts       from '@/pages/Alerts';
import GPSTracker   from '@/pages/GPSTracker';
import Settings     from '@/pages/Settings';

import AccessRequests from '@/pages/doctor/AccessRequests';
import PatientVitals  from '@/pages/doctor/PatientVitals';

import FamilyLayout    from '@/layouts/FamilyLayout';
import FamilyDashboard from '@/pages/family/FamilyDashboard';
import FamilyPatient   from '@/pages/family/FamilyPatient';

import { AlertsProvider } from '@/contexts/AlertsContext';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — redirect logged-in users away from auth page */}
        <Route element={<ProtectedRoute guestOnly />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/auth" replace />} />

        <Route path="/unauthorized" element={
          <div className="min-h-screen bg-bg-base flex items-center justify-center">
            <p className="text-status-critical font-mono text-sm">Access denied.</p>
          </div>
        } />

        {/* Doctor routes — wrapped in AlertsProvider so one subscription serves all pages */}
        <Route element={<ProtectedRoute requiredRole="doctor" />}>
          <Route element={
            <AlertsProvider>
              <Layout />
            </AlertsProvider>
          }>
            <Route path="dashboard"                element={<Dashboard />} />
            <Route path="patients"                 element={<PatientList />} />
            <Route path="trends"                   element={<HealthTrends />} />
            <Route path="alerts"                   element={<Alerts />} />
            <Route path="gps"                      element={<GPSTracker />} />
            <Route path="settings"                 element={<Settings />} />
            <Route path="requests"                 element={<AccessRequests />} />
            <Route path="patient/:patientId/live"  element={<PatientVitals />} />
          </Route>
        </Route>

        {/* Family routes */}
        <Route element={<ProtectedRoute requiredRole="family" />}>
          <Route path="/family" element={<FamilyLayout />}>
            <Route index                     element={<FamilyDashboard />} />
            <Route path="patient/:patientId" element={<FamilyPatient />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}