import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  BarChart3,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  FileDown,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  getGestorReport,
  getPeriodDates,
  STATUS_INFO,
  PERIOD_OPTIONS,
  type GestorReport,
  type PeriodType,
} from '@/services/reports'
import { getInsurers, type InsurerRecord } from '@/services/insurers'
import { cn } from '@/lib/utils'
import { LoadingCards, LoadingRows, ErrorState, EmptyState } from '@/components/page-states'
import { printDocument } from '@/lib/pdf-export'

export default function Reports() {
  const [period, setPeriod] = useState<PeriodType>('mes')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [insurerId, setInsurerId] = useState('all')
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [report, setReport] = useState<GestorReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getInsurers()
      .then(setInsurers)
      .catch(() => {})
  }, [])

  const loadData = useCallback(async () => {
    const { start, end } = getPeriodDates(period, customStart, customEnd)
    if (!start || !end) {
      setReport(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getGestorReport(start, end, insurerId)
      setReport(data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [period, customStart, customEnd, insurerId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('folders', () => loadData())

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <LoadingCards count={4} />
        <Card>
          <CardContent className="p-0">
            <LoadingRows count={5} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios</h1>
        </div>
        <ErrorState message="Não foi possível carregar os relatórios." onRetry={loadData} />
      </div>
    )
  }

  const ind = report?.indicators
  const indicators = [
    {
      label: 'Pago aos Proprietários',
      value: ind?.total_paid_to_owners || 0,
      icon: ArrowUpCircle,
      color: 'text-blue-600',
    },
    {
      label: 'Recebido das Seguradoras',
      value: ind?.total_received_from_insurers || 0,
      icon: ArrowDownCircle,
      color: 'text-green-600',
    },
    {
      label: 'Destinado aos Investidores',
      value: ind?.total_investor_share || 0,
      icon: Wallet,
      color: 'text-purple-600',
    },
    {
      label: 'Destinado à Empresa',
      value: ind?.total_company_share || 0,
      icon: Building2,
      color: 'text-orange-600',
    },
  ]

  const hasData = report && report.total_folders > 0

  const handleExportPDF = () => {
    const summary = indicators.map((item) => ({
      label: item.label,
      value: formatCurrency(item.value),
    }))

    const openFolderRows = (report?.open_folders || []).map((f) => ({
      contrato: f.contract_number,
      proprietario: f.owner_name || '-',
      seguradora: f.insurer_name || '-',
      status: f.status,
      vencimento: formatDate(f.due_date),
      recebimento_previsto: formatDate(f.estimated_receipt_date),
    }))

    printDocument(
      'Relatório de Repasses',
      [
        {
          title: `Pastas em Aberto (${report?.open_folders?.length || 0})`,
          columns: [
            { header: 'Contrato', key: 'contrato' },
            { header: 'Proprietário', key: 'proprietario' },
            { header: 'Seguradora', key: 'seguradora' },
            { header: 'Status', key: 'status' },
            { header: 'Vencimento', key: 'vencimento' },
            { header: 'Recebimento Previsto', key: 'recebimento_previsto' },
          ],
          rows: openFolderRows,
        },
      ],
      summary,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios</h1>
        </div>
        {hasData && (
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={period === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(opt.value)}
          >
            {opt.label}
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
        <Select value={insurerId} onValueChange={setInsurerId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seguradora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Seguradoras</SelectItem>
            {insurers.map((ins) => (
              <SelectItem key={ins.id} value={ins.id}>
                {ins.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!hasData ? (
        <EmptyState message="Nenhum dado encontrado para o período selecionado." icon={BarChart3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {indicators.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <Icon className={cn('h-5 w-5', item.color)} />
                    </div>
                    <p className="mt-2 text-xl font-bold">{formatCurrency(item.value)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pastas em Aberto ({report?.open_folders?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Nº da Pasta</th>
                      <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                      <th className="px-4 py-3 text-left font-medium">Seguradora</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                      <th className="px-4 py-3 text-left font-medium">Recebimento Previsto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.open_folders || []).map((folder) => (
                      <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                        <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                        <td className="px-4 py-3">{folder.insurer_name || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-xs font-medium',
                              STATUS_INFO[folder.status]?.className || 'bg-gray-100 text-gray-800',
                            )}
                          >
                            {STATUS_INFO[folder.status]?.label || folder.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDate(folder.due_date)}</td>
                        <td className="px-4 py-3">{formatDate(folder.estimated_receipt_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
