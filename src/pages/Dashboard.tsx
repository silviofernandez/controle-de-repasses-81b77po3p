import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderCog, Wallet, Plus, TrendingUp, X } from 'lucide-react'
import { getFolders, type FolderRecord } from '@/services/folders'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/format'
import { LoadingCards, ErrorState, EmptyState } from '@/components/page-states'
import { computeRepassValue } from '@/lib/repass-utils'
import {
  statusLabels,
  statusBadgeVariants,
  statusColors,
  FOLDER_STATUSES,
} from '@/lib/status-config'

function getFirstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function getLastDayOfMonth() {
  const d = new Date()
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}

function dateInRange(date: string, start: string, end: string): boolean {
  if (!date) return false
  const d = date.split(' ')[0]
  return d >= start && d <= end
}

export default function Dashboard() {
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<'a_repassar' | 'repassadas'>('a_repassar')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [periodStart, setPeriodStart] = useState(getFirstDayOfMonth())
  const [periodEnd, setPeriodEnd] = useState(getLastDayOfMonth())

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getFolders()
      setFolders(data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('folders', () => loadData())

  const aRepassar = useMemo(() => folders.filter((f) => f.status === 'à repassar'), [folders])
  const totalOutstanding = useMemo(
    () =>
      folders
        .filter((f) => ['garantido', 'em análise', 'pgto agendado'].includes(f.status))
        .reduce((s, f) => s + (f.rent_amount || 0), 0),
    [folders],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of FOLDER_STATUSES) {
      counts[s] = folders.filter((f) => f.status === s).length
    }
    return counts
  }, [folders])

  const financial = useMemo(() => {
    const garantidos = folders.filter(
      (f) =>
        f.status !== 'à repassar' &&
        f.repassed_date &&
        dateInRange(f.repassed_date, periodStart, periodEnd),
    )
    const totalGarantidos = garantidos.reduce((s, f) => s + (f.rent_amount || 0), 0)
    const emAberto = garantidos.filter((f) => f.status !== 'recebido')
    const totalEmAberto = emAberto.reduce((s, f) => s + (f.rent_amount || 0), 0)
    const recebidos = folders.filter(
      (f) =>
        f.status === 'recebido' &&
        f.actual_receipt_date &&
        dateInRange(f.actual_receipt_date, periodStart, periodEnd),
    )
    const totalExtra = recebidos.reduce(
      (s, f) => s + Math.max(0, (f.received_amount || 0) - (f.rent_amount || 0)),
      0,
    )
    return {
      totalGarantidos,
      totalEmAberto,
      totalExtra,
      investorExtra: totalExtra * 0.25,
      companyExtra: totalExtra * 0.75,
    }
  }, [folders, periodStart, periodEnd])

  const listFolders = useMemo(() => {
    if (statusFilter) return folders.filter((f) => f.status === statusFilter)
    if (activeTab === 'a_repassar') return aRepassar
    return folders.filter((f) => f.status !== 'à repassar')
  }, [folders, activeTab, statusFilter, aRepassar])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <LoadingCards count={4} />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <ErrorState onRetry={loadData} />
      </div>
    )
  }

  if (folders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button asChild>
            <Link to="/folders/new">
              <Plus className="mr-2 h-4 w-4" /> Nova Pasta
            </Link>
          </Button>
        </div>
        <EmptyState message="Nenhum dado disponível para exibir no momento." />
      </div>
    )
  }

  const repassadasCount = folders.filter((f) => f.status !== 'à repassar').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/folders/new">
            <Plus className="mr-2 h-4 w-4" /> Nova Pasta
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            setStatusFilter(null)
            setActiveTab('a_repassar')
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pastas</p>
                <p className="text-2xl font-bold">{aRepassar.length}</p>
                <p className="text-xs text-muted-foreground">À repassar</p>
              </div>
              <FolderCog className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            setStatusFilter(null)
            setActiveTab('repassadas')
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
                <p className="text-xs text-muted-foreground">Em aberto para receber</p>
              </div>
              <Wallet className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {FOLDER_STATUSES.map((status) => (
          <Card
            key={status}
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${statusFilter === status ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{statusLabels[status]}</p>
              <p className={`text-2xl font-bold ${statusColors[status]}`}>
                {statusCounts[status] || 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Resumo Financeiro</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">De:</span>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-40"
              />
              <span className="text-sm text-muted-foreground">Até:</span>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted/50"
              onClick={() => setStatusFilter('garantido')}
            >
              <p className="text-sm text-muted-foreground">Aluguéis Garantidos</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(financial.totalGarantidos)}
              </p>
            </div>
            <div
              className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted/50"
              onClick={() => setStatusFilter('garantido')}
            >
              <p className="text-sm text-muted-foreground">Aluguéis Em Aberto</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(financial.totalEmAberto)}
              </p>
            </div>
            <div
              className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted/50"
              onClick={() => setStatusFilter('recebido')}
            >
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Extras Feitos (Lucro 20%)</p>
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(financial.totalExtra)}
              </p>
              <div className="mt-1 flex gap-4 text-xs">
                <span className="text-purple-600">
                  5% Investidor: {formatCurrency(financial.investorExtra)}
                </span>
                <span className="text-orange-600">
                  15% Empresa: {formatCurrency(financial.companyExtra)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as 'a_repassar' | 'repassadas')
          setStatusFilter(null)
        }}
      >
        <TabsList>
          <TabsTrigger value="a_repassar">À Repassar ({aRepassar.length})</TabsTrigger>
          <TabsTrigger value="repassadas">Repassadas ({repassadasCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {statusFilter && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{statusLabels[statusFilter]}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)}>
            <X className="mr-1 h-3 w-3" /> Limpar filtro
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {listFolders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma pasta encontrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Contrato</th>
                    <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                    <th className="px-4 py-3 text-left font-medium">Valor</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {listFolders.slice(0, 10).map((folder) => (
                    <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/folders/${folder.id}`} className="hover:underline">
                          {folder.contract_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                      <td className="px-4 py-3">{formatCurrency(folder.rent_amount || 0)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariants[folder.status] || 'secondary'}>
                          {statusLabels[folder.status] || folder.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {folder.repassed_date
                          ? formatDate(folder.repassed_date)
                          : formatDate(folder.due_date || '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
