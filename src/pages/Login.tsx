import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Building2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, isAuthenticated, role, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (isAuthenticated && role) {
    return <Navigate to={role === 'gestor' ? '/dashboard' : '/investor-dashboard'} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError, role: userRole } = await signIn(email, password)
    if (signInError) {
      const errMsg = typeof signInError?.message === 'string' ? signInError.message : ''
      if (errMsg.includes('Perfil não encontrado')) {
        setError(errMsg)
      } else {
        setError('E-mail ou senha inválidos.')
      }
      setLoading(false)
    } else if (userRole === 'gestor') {
      navigate('/dashboard')
    } else if (userRole === 'investidor') {
      navigate('/investor-dashboard')
    } else {
      setError('Não foi possível determinar seu perfil.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">Controle de Repasses</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Aluguéis Garantidos</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-xs text-slate-400 border-t border-slate-100 pt-3">
            <p>Credenciais de teste:</p>
            <p className="font-medium text-slate-500">gabsilvio@gmail.com / Skip@Pass</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
