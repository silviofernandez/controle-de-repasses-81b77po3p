import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (role === 'gestor') return <Navigate to="/dashboard" replace />
  if (role === 'investidor') return <Navigate to="/investor-dashboard" replace />
  return <Navigate to="/login" replace />
}
