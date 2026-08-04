import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import InvestorDashboard from '@/pages/InvestorDashboard'
import Folders from '@/pages/Folders'
import FolderNew from '@/pages/FolderNew'
import Relationships from '@/pages/Relationships'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Payments from '@/pages/Payments'
import NotFound from '@/pages/NotFound'
import { Layout } from '@/components/Layout'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['gestor']} />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/folders/new" element={<FolderNew />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/relationships" element={<Relationships />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['investidor']} />}>
            <Route element={<Layout />}>
              <Route path="/investor-dashboard" element={<InvestorDashboard />} />
              <Route path="/payments" element={<Payments />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
