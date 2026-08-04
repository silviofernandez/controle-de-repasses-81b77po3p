import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { getProfileByUserId } from '@/services/profiles'

interface SignInResult {
  error: any
  role?: string
}

interface AuthContextType {
  user: any
  role: string | null
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

async function fetchUserRole(userId: string): Promise<string | null> {
  try {
    const profile = await getProfileByUserId(userId)
    const role = (profile as any).role
    if (role === 'gestor' || role === 'investidor') return role
    return null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(pb.authStore.isValid ? record : null)
      setIsAuthenticated(pb.authStore.isValid)
      if (!pb.authStore.isValid) {
        setRole(null)
      }
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then(async () => {
          const userId = pb.authStore.record?.id
          if (userId) {
            const userRole = await fetchUserRole(userId)
            if (!userRole) {
              pb.authStore.clear()
            }
            setRole(userRole)
          }
        })
        .catch(() => {
          pb.authStore.clear()
          setRole(null)
        })
        .finally(() => setLoading(false))
    } else {
      if (pb.authStore.record) pb.authStore.clear()
      setLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        role: 'investidor',
      })
      await pb.collection('users').authWithPassword(email, password)
      const userId = pb.authStore.record?.id
      if (userId) {
        const userRole = await fetchUserRole(userId)
        if (!userRole) {
          pb.authStore.clear()
          return {
            error: {
              message: 'Perfil não encontrado. Contate o administrador para ativar sua conta.',
            },
          }
        }
        setRole(userRole)
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      const userId = pb.authStore.record?.id
      if (!userId) {
        pb.authStore.clear()
        return { error: { message: 'Erro ao autenticar.' } }
      }
      const userRole = await fetchUserRole(userId)
      if (!userRole) {
        pb.authStore.clear()
        return { error: { message: 'Perfil não encontrado. Contate o administrador.' } }
      }
      setRole(userRole)
      return { error: null, role: userRole }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
