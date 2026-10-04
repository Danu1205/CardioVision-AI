
import { Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'

import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'

import Patients from './pages/patients/Patients'
import PatientRegistration from './pages/patients/PatientRegistration'
import PatientDetails from './pages/patients/PatientDetails'
import PatientEdit from './pages/patients/PatientEdit'

import Analysis from './pages/analysis/Analysis'
import MRIUpload from './pages/analysis/MRIUpload'
import MRIPreview from './pages/analysis/MRIPreview'
import AnalysisResults from './pages/analysis/AnalysisResults'
import StudyDetails from './pages/analysis/StudyDetails'

import HistoryPage from './pages/history/History'
import Reports from './pages/reports/Reports'
import ModelPerformance from './pages/performance/ModelPerformance'
import SettingsPage from './pages/settings/Settings'

import UserManagement from './pages/admin/UserManagement'
import PatientAssignments from './pages/admin/PatientAssignments'

function App() {
  const savedLandingPage = localStorage.getItem('cardiovision_default_landing')

  const allowedLandingPages = ['/dashboard', '/patients', '/analysis']

  const landingPage = allowedLandingPages.includes(savedLandingPage || '')
    ? savedLandingPage!
    : '/dashboard'

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={landingPage} replace />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Patients */}
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/register" element={<PatientRegistration />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/patients/:id/edit" element={<PatientEdit />} />

          {/* MRI Analysis */}
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/analysis/upload" element={<MRIUpload />} />
          <Route path="/analysis/preview" element={<MRIPreview />} />
          <Route path="/analysis/results" element={<AnalysisResults />} />
          <Route path="/analysis/studies/:studyId" element={<StudyDetails />} />

          {/* History and Reports */}
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/reports" element={<Reports />} />

          {/* Model Performance and Settings */}
          <Route path="/performance" element={<ModelPerformance />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/assignments" element={<PatientAssignments />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
