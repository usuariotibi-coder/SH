import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import CalendarPage from './pages/calendar/CalendarPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import RequirementsPage from './pages/requirements/RequirementsPage';
import RequirementDetailPage from './pages/requirements/RequirementDetailPage';
import IncidentsPage from './pages/incidents/IncidentsPage';
import IncidentDetailPage from './pages/incidents/IncidentDetailPage';
import CMSHPage from './pages/cmsh/CMSHPage';
import BrigadesPage from './pages/brigades/BrigadesPage';
import TrainingPage from './pages/training/TrainingPage';
import DrillsPage from './pages/drills/DrillsPage';
import FiveSPage from './pages/fiveS/FiveSPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import RisksPage from './pages/risks/RisksPage';
import AuditsPage from './pages/audits/AuditsPage';
import ProgramPage from './pages/program/ProgramPage';
import GuidePage from './pages/guide/GuidePage';
import UsersPage from './pages/admin/UsersPage';
import CompaniesPage from './pages/admin/CompaniesPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import SupplierDetailPage from './pages/suppliers/SupplierDetailPage';
import SupplierPortalPage from './pages/portal/SupplierPortalPage';
import EppPage from './pages/epp/EppPage';
import useAuthStore from './store/auth.store';

export default function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: 'var(--font-body)', fontSize: '14px' },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="requirements" element={<RequirementsPage />} />
          <Route path="requirements/:id" element={<RequirementDetailPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          <Route path="cmsh" element={<CMSHPage />} />
          <Route path="brigades" element={<BrigadesPage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="drills" element={<DrillsPage />} />
          <Route path="five-s" element={<FiveSPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="risks" element={<RisksPage />} />
          <Route path="audits" element={<AuditsPage />} />
          <Route path="program" element={<ProgramPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="epp" element={<EppPage />} />
          <Route path="admin/users" element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="admin/companies" element={
            <ProtectedRoute roles={['ADMIN']}>
              <CompaniesPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Public portal route — outside ProtectedRoute */}
        <Route path="/portal/:token" element={<SupplierPortalPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
