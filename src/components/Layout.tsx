import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export function Layout() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 hidden sm:inline text-base">
                Controle de Repasses de Aluguéis Garantidos
              </span>
              <span className="font-bold tracking-tight text-slate-900 sm:hidden text-base">
                Controle de Repasses
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-slate-600">Controle de Repasses de Aluguéis Garantidos</p>
          <p className="text-slate-400">
            Sistema de controle de repasses de aluguéis garantidos &copy; {currentYear}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
