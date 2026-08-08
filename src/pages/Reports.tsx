import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  FileDown,
  FileSpreadsheet,
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
  type ReportFolder,
} from '@/services/reports'
import { getInsurers, type InsurerRecord } from '@/services/insurers'
import { cn } from '@/lib/utils'
import { LoadingCards, LoadingRows, ErrorState, EmptyState } from '@/components/page-states'
import { printDocument } from '@/lib/pdf-export'
import { exportToXlsx } from '@/lib/xlsx-export'
import { ReceiptForecast } from '@/components/ReceiptForecast'
import { AnnualReportSection } from '@/components/AnnualReportSection'

function calcDays(repassedDate: string, receiptDate?: string): number {
  if (!repassedDate) return 0
  const start = new Date(repassedDate + 'T00:00:00Z')
  const end = receiptDate ? new Date(receiptDate + 'T00:00:00Z') : new Date()
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000))
}

function calcPctReceived(received: number, repassed: number): number {
  if (repassed <= 0) return 0
  return ((received - repassed) / repassed) * 100
}

export default function Reports() {
  const [period, setPeriod] = useState<PeriodType>('mes')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [insurerId, setInsurerId] = useState('all')
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [report, setReport] = useState<GestorReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [view, setView] = useState<'open' | 'closed' | 'forecast' | 'annual'>('open')

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

  const isSelfManagedView = view === 'forecast' || view === 'annual'

  if (loading && !isSelfManagedView) {
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
  if (error && !isSelfManagedView) {
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
  const openFolders = report?.open_folders || []
  const closedFolders = report?.closed_folders || []

  const handleExportPDF = () => {
    const summary = indicators.map((item) => ({
      label: item.label,
      value: formatCurrency(item.value),
    }))
    if (view === 'open') {
      const rows = openFolders.map((f) => ({
        contrato: f.contract_number,
        proprietario: f.owner_name || '-',
        seguradora: f.insurer_name || '-',
        status: STATUS_INFO[f.status]?.label || f.status,
        repasse: formatDate(f.repassed_date),
        dias: String(calcDays(f.repassed_date)),
        recebimento_previsto: formatDate(f.estimated_receipt_date),
      }))
      printDocument(
        'Relatório de Repasses — Pastas Abertas',
        [
          {
            title: `Pastas Abertas (${openFolders.length})`,
            columns: [
              { header: 'Contrato', key: 'contrato' },
              { header: 'Proprietário', key: 'proprietario' },
              { header: 'Seguradora', key: 'seguradora' },
              { header: 'Status', key: 'status' },
              { header: 'Repasse', key: 'repasse' },
              { header: 'Dias', key: 'dias' },
              { header: 'Recebimento Previsto', key: 'recebimento_previsto' },
            ],
            rows,
          },
        ],
        summary,
      )
    } else {
      const rows = closedFolders.map((f) => {
        const pct = calcPctReceived(f.received_amount, f.investor_share_amount)
        return {
          contrato: f.contract_number,
          proprietario: f.owner_name || '-',
          seguradora: f.insurer_name || '-',
          status: STATUS_INFO[f.status]?.label || f.status,
          repasse: formatDate(f.repassed_date),
          dias: String(calcDays(f.repassed_date, f.actual_receipt_date)),
          recebimento_previsto: formatDate(f.estimated_receipt_date),
          data_recebimento: formatDate(f.actual_receipt_date),
          valor_repasse: formatCurrency(f.investor_share_amount),
          valor_recebido: formatCurrency(f.received_amount),
          pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
        }
      })
      printDocument(
        'Relatório de Repasses — Pastas Fechadas',
        [
          {
            title: `Pastas Fechadas (${closedFolders.length})`,
            columns: [
              { header: 'Contrato', key: 'contrato' },
              { header: 'Proprietário', key: 'proprietario' },
              { header: 'Seguradora', key: 'seguradora' },
              { header: 'Status', key: 'status' },
              { header: 'Repasse', key: 'repasse' },
              { header: 'Dias', key: 'dias' },
              { header: 'Recebimento Previsto', key: 'recebimento_previsto' },
              { header: 'Data Recebimento', key: 'data_recebimento' },
              { header: 'Valor Repasse', key: 'valor_repasse' },
              { header: 'Valor Recebido', key: 'valor_recebido' },
              { header: '% a mais', key: 'pct' },
            ],
            rows,
          },
        ],
        summary,
      )
    }
  }

  const handleExportExcel = () => {
    if (view === 'open') {
      const rows = openFolders.map((f) => [
        f.contract_number,
        f.owner_name || '-',
        f.insurer_name || '-',
        STATUS_INFO[f.status]?.label || f.status,
        formatDate(f.repassed_date),
        calcDays(f.repassed_date),
        formatDate(f.estimated_receipt_date),
      ])
      exportToXlsx(
        'relatorio-pastas-abertas.xlsx',
        [
          'Contrato',
          'Proprietário',
          'Seguradora',
          'Status',
          'Repasse',
          'Dias',
          'Recebimento Previsto',
        ],
        rows,
        { sheetName: 'Pastas Abertas' },
      )
    } else {
      const rows = closedFolders.map((f) => {
        const pct = calcPctReceived(f.received_amount, f.investor_share_amount)
        return [
          f.contract_number,
          f.owner_name || '-',
          f.insurer_name || '-',
          STATUS_INFO[f.status]?.label || f.status,
          formatDate(f.repassed_date),
          calcDays(f.repassed_date, f.actual_receipt_date),
          formatDate(f.estimated_receipt_date),
          formatDate(f.actual_receipt_date),
          formatCurrency(f.investor_share_amount),
          formatCurrency(f.received_amount),
          `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
        ]
      })
      exportToXlsx(
        'relatorio-pastas-fechadas.xlsx',
        [
          'Contrato',
          'Proprietário',
          'Seguradora',
          'Status',
          'Repasse',
          'Dias',
          'Recebimento Previsto',
          'Data Recebimento',
          'Valor Repasse',
          'Valor Recebido',
          '% a mais',
        ],
        rows,
        { sheetName: 'Pastas Fechadas' },
      )
    }
  }

  const renderStatusBadge = (status: string) => (
    <span
      className={cn(
        'rounded-full px-2 py-1 text-xs font-medium',
        STATUS_INFO[status]?.className || 'bg-gray-100 text-gray-800',
      )}
    >
      {STATUS_INFO[status]?.label || status}
    </span>
  )

  const renderFolderRow = (folder: ReportFolder, isClosed: boolean) => {
    const days = isClosed
      ? calcDays(folder.repassed_date, folder.actual_receipt_date)
      : calcDays(folder.repassed_date)
    const pct = calcPctReceived(folder.received_amount, folder.investor_share_amount)
    return (
      <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
        <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
        <td className="px-4 py-3">{folder.owner_name || '-'}</td>
        <td className="px-4 py-3">{folder.insurer_name || '-'}</td>
        <td className="px-4 py-3">{renderStatusBadge(folder.status)}</td>
        <td className="px-4 py-3">{formatDate(folder.repassed_date)}</td>
        <td className="px-4 py-3">{days}</td>
        <td className="px-4 py-3">{formatDate(folder.estimated_receipt_date)}</td>
        {isClosed && (
          <>
            <td className="px-4 py-3">{formatDate(folder.actual_receipt_date)}</td>
            <td className="px-4 py-3">{formatCurrency(folder.investor_share_amount)}</td>
            <td className="px-4 py-3 font-medium text-green-600">
              {formatCurrency(folder.received_amount)}
            </td>
            <td className="px-4 py-3">
              <span
                className={pct >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}
              >
                {pct >= 0 ? '+' : ''}
                {pct.toFixed(1)}%
              </span>
            </td>
          </>
        )}
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Relatórios</h1>
        </div>
        {hasData && !isSelfManagedView && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Excel
            </Button>
          </div>
        )}
      </div>

      {!isSelfManagedView && (
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
      )}

      <Tabs
        value={view}
        onValueChange={(v) => setView(v as 'open' | 'closed' | 'forecast' | 'annual')}
      >
        <TabsList>
          <TabsTrigger value="open">Pastas Abertas ({openFolders.length})</TabsTrigger>
          <TabsTrigger value="closed">Pastas Fechadas ({closedFolders.length})</TabsTrigger>
          <TabsTrigger value="forecast">Previsão de Recebimento</TabsTrigger>
          <TabsTrigger value="annual">Relatório Anual</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'forecast' ? (
        <ReceiptForecast />
      ) : view === 'annual' ? (
        <AnnualReportSection />
      ) : !hasData ? (
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
          {view === 'open' ? (
            <Card>
              <CardHeader>
                <CardTitle>Pastas Abertas ({openFolders.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {openFolders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma pasta em aberto.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Nº da Pasta</th>
                          <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                          <th className="px-4 py-3 text-left font-medium">Seguradora</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Repasse</th>
                          <th className="px-4 py-3 text-left font-medium">Dias</th>
                          <th className="px-4 py-3 text-left font-medium">Recebimento Previsto</th>
                        </tr>
                      </thead>
                      <tbody>{openFolders.map((f) => renderFolderRow(f, false))}</tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pastas Fechadas — Recebidas ({closedFolders.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {closedFolders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma pasta fechada.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Nº da Pasta</th>
                          <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                          <th className="px-4 py-3 text-left font-medium">Seguradora</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Repasse</th>
                          <th className="px-4 py-3 text-left font-medium">Dias</th>
                          <th className="px-4 py-3 text-left font-medium">Recebimento Previsto</th>
                          <th className="px-4 py-3 text-left font-medium">Data do Recebimento</th>
                          <th className="px-4 py-3 text-left font-medium">Valor do Repasse</th>
                          <th className="px-4 py-3 text-left font-medium">Valor Recebido</th>
                          <th className="px-4 py-3 text-left font-medium">% a mais</th>
                        </tr>
                      </thead>
                      <tbody>{closedFolders.map((f) => renderFolderRow(f, true))}</tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
