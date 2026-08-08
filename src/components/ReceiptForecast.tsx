import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CalendarClock } from 'lucide-react'
import { getFoldersByStatus, type FolderRecord } from '@/services/folders'
import { formatCurrency, formatDate } from '@/lib/format'
import { LoadingRows, ErrorState, EmptyState } from '@/components/page-states'
import { computeDefaultReceivedValue } from '@/lib/repass-utils'
import { useRealtime } from '@/hooks/use-realtime'

type ForecastPeriod = 'hoje' | 'semana' | 'mes' | 'personalizado'

function getPeriodRange(period: ForecastPeriod, customStart?: string, customEnd?: string) {
  const today = new Date()
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  switch (period) {
    case 'hoje':
      return { start: fmt(today), end: fmt(today) }
    case 'semana': {
      const day = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return { start: fmt(monday), end: fmt(sunday) }
    }
    case 'mes':
      return {
        start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      }
    case 'personalizado':
      return { start: customStart || '', end: customEnd || '' }
  }
}

export function ReceiptForecast() {
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState<ForecastPeriod>('mes')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const load = async () => {
    try {
      const data = await getFoldersByStatus('pgto agendado')
      setFolders(data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('folders', () => {
    load()
  })

  const { start, end } = getPeriodRange(period, customStart, customEnd)

  const filtered = useMemo(() => {
    return folders.filter((f) => {
      if (!f.estimated_receipt_date) return false
      const d = f.estimated_receipt_date.split(' ')[0]
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }, [folders, start, end])

  const totalExpected = filtered.reduce((s, f) => s + computeDefaultReceivedValue(f), 0)

  if (loading) return <LoadingRows count={5} />
  if (error)
    return (
      <ErrorState message="Não foi possível carregar a previsão de recebimento." onRetry={load} />
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['hoje', 'semana', 'mes', 'personalizado'] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === 'hoje'
              ? 'Hoje'
              : p === 'semana'
                ? 'Semana'
                : p === 'mes'
                  ? 'Mês'
                  : 'Personalizado'}
          </Button>
        ))}
        {period === 'personalizado' && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-40"
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Previsto no Período</p>
                <p className="text-2xl font-bold text-cyan-600">{formatCurrency(totalExpected)}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quantidade de Pastas</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          message="Nenhuma previsão de recebimento no período selecionado."
          icon={CalendarClock}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Previsão de Recebimento</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Contrato</th>
                    <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                    <th className="px-4 py-3 text-left font-medium">Seguradora</th>
                    <th className="px-4 py-3 text-left font-medium">Data do Agendamento</th>
                    <th className="px-4 py-3 text-left font-medium">Valor Previsto</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((folder) => (
                    <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                      <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                      <td className="px-4 py-3">{folder.expand?.insurer_id?.name || '-'}</td>
                      <td className="px-4 py-3">{formatDate(folder.estimated_receipt_date)}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(computeDefaultReceivedValue(folder))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">Pgto Agendado</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
