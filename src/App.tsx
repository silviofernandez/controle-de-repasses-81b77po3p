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
import Payments from '@/pages/Payments'
import Relationships from '@/pages/Relationships'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import InvestorDashboard from '@/pages/InvestorDashboard'
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/folders" element={<Folders />} />
            <Route path="/folders/new" element={<FolderNew />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/relationships" element={<Relationships />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/investor" element={<InvestorDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}
