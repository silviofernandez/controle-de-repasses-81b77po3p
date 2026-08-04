import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  FolderCog,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Wallet,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/folders', label: 'Pastas', icon: FolderCog },
  { to: '/payments', label: 'Repasses', icon: Wallet },
  { to: '/insurer-submissions', label: 'Envios à Seguradora', icon: Send, roles: ['gestor'] },
  { to: '/relationships', label: 'Relacionamentos', icon: Users },
  { to: '/reports', label: 'Relatórios', icon: BarChart3, roles: ['gestor'] },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

function NavLinks({ onNavigate, userRole }: { onNavigate?: () => void; userRole?: string }) {
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(userRole || ''))
  return (
    <nav className="flex flex-col gap-1 px-3">
      {visibleItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function Layout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Controle de Repasses</span>
        </div>
        <div className="flex-1 py-4">
          <NavLinks userRole={user?.role} />
        </div>
        <div className="border-t p-4">
          <div className="mb-3 truncate text-sm text-muted-foreground">
            {user?.email || 'Usuário'}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-bold">Repasses</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-16 items-center gap-2 border-b px-6">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Repasses</span>
              </div>
              <div className="py-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} userRole={user?.role} />
              </div>
              <div className="border-t p-4">
                <div className="mb-3 truncate text-sm text-muted-foreground">
                  {user?.email || 'Usuário'}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
