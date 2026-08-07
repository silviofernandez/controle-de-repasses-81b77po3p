import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const { user } = useAuth()
  const target = user?.role === 'investidor' ? '/investor-dashboard' : '/dashboard'
  return <Navigate to={target} replace />
}
