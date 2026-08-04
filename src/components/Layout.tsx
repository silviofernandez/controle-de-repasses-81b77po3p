import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Building2,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  Wallet,
  CalendarClock,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = {
  gestor: [
    { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
    { to: '/folders', label: 'Pastas', icon: FolderOpen },
    { to: '/relationships', label: 'Relação para Seguradora', icon: FileText },
    { to: '/reports', label: 'Relatórios', icon: BarChart3 },
    { to: '/settings', label: 'Configurações', icon: SettingsIcon },
  ],
  investidor: [
    { to: '/investor-dashboard', label: 'Meu Extrato', icon: Wallet },
    { to: '/payments', label: 'Próximos Pagamentos', icon: CalendarClock },
  ],
}

function SidebarNav({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const location = useLocation()
  const items = navItems[role as keyof typeof navItems] || []
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-200">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
        <Building2 className="h-5 w-5" />
      </div>
      <span className="font-bold tracking-tight text-slate-900 text-sm">Controle de Repasses</span>
    </div>
  )
}

function SignOutButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="w-full justify-start text-slate-600 hover:text-slate-900"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sair
    </Button>
  )
}

export function Layout() {
  const currentYear = new Date().getFullYear()
  const { signOut, role } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white">
        <Brand />
        <SidebarNav role={role || ''} />
        <div className="mt-auto p-3 border-t border-slate-200">
          <SignOutButton onClick={handleSignOut} />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-3 left-3 z-50 bg-white/80 backdrop-blur-md border border-slate-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <Brand />
          <SidebarNav role={role || ''} onNavigate={() => setMobileOpen(false)} />
          <div className="mt-auto p-3 border-t border-slate-200">
            <SignOutButton onClick={handleSignOut} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full md:pl-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 bg-white/50 py-4 text-center text-xs text-slate-500">
          <p>Sistema de controle de repasses de aluguéis garantidos &copy; {currentYear}</p>
        </footer>
      </div>
    </div>
  )
}

export default Layout
