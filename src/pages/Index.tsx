import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { checkDatabaseHealth } from '@/services/health'

export default function Index() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'failed'>('loading')

  const verifyConnection = useCallback(async () => {
    setStatus('loading')
    const isHealthy = await checkDatabaseHealth()
    setStatus(isHealthy ? 'connected' : 'failed')
  }, [])

  useEffect(() => {
    verifyConnection()
  }, [verifyConnection])

  return (
    <div className="w-full py-16 md:py-24 flex flex-col items-center justify-center text-center">
      <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-medium text-emerald-800 shadow-sm shadow-emerald-600/10 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
        <span>Projeto inicializado</span>
      </div>

      <h1 className="animate-fade-in-up [animation-delay:80ms] max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-[1.1]">
        Controle de Repasses de{' '}
        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500 bg-clip-text text-transparent">
          Aluguéis Garantidos
        </span>
      </h1>

      <p className="animate-fade-in-up [animation-delay:160ms] mt-4 max-w-xl text-base sm:text-lg text-slate-500">
        Estrutura inicial do projeto — pronto para o desenvolvimento das telas de negócio.
      </p>

      <div className="animate-fade-in-up [animation-delay:240ms] mt-10 w-full max-w-md">
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {status === 'loading' && (
              <div className="flex items-center gap-3 text-amber-600 font-medium py-1">
                <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                <span className="text-sm">Verificando conexão…</span>
              </div>
            )}

            {status === 'connected' && (
              <div className="flex items-center gap-3 text-emerald-700 font-medium py-1 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="text-sm">Conectado ao banco de dados</span>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex flex-col items-center gap-3 py-1 animate-fade-in">
                <div className="flex items-center gap-2.5 text-red-600 font-medium">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <span className="text-sm">Falha na conexão</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={verifyConnection}
                  className="mt-1 gap-2 border-slate-200 hover:bg-slate-50 text-xs hover:scale-[1.03] active:scale-[0.98] transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
