import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/use-auth'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Dashboard from '@/pages/Dashboard'
import Folders from '@/pages/Folders'
import FolderNew from '@/pages/FolderNew'
import FolderDetail from '@/pages/FolderDetail'
import Payments from '@/pages/Payments'
import Receipts from '@/pages/Receipts'
import Relationships from '@/pages/Relationships'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import InvestorDashboard from '@/pages/InvestorDashboard'
import InvestorUpcoming from '@/pages/InvestorUpcoming'
import InsurerSubmissions from '@/pages/InsurerSubmissions'
import Insurers from '@/pages/Insurers'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/folders"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <Folders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/folders/new"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <FolderNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/folders/:id"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <FolderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipts"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <Receipts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurer-submissions"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <InsurerSubmissions />
                </ProtectedRoute>
              }
            />
            <Route path="/relationships" element={<Relationships />} />
            <Route
              path="/insurers"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <Insurers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['gestor']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/investor-dashboard"
              element={
                <ProtectedRoute allowedRoles={['investidor']}>
                  <InvestorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor-upcoming"
              element={
                <ProtectedRoute allowedRoles={['investidor']}>
                  <InvestorUpcoming />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor"
              element={
                <ProtectedRoute allowedRoles={['investidor']}>
                  <InvestorDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}
