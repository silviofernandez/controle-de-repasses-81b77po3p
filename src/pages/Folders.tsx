import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FolderCog,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  FileDown,
  FileSpreadsheet,
  X,
  Filter,
} from 'lucide-react'
import { getFolders, deleteFolder, updateFolder, type FolderRecord } from '@/services/folders'
import { getInsurers, type InsurerRecord } from '@/services/insurers'
import { FolderFormDialog } from '@/components/FolderFormDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { CurrencyInput } from '@/components/ui/currency-input'
import { computeRepassValue } from '@/lib/repass-utils'
import { exportToXlsx } from '@/lib/xlsx-export'
import { exportToCsv } from '@/lib/csv-export'
import { LoadingRows, ErrorState, EmptyState } from '@/components/page-states'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const statusLabels: Record<string, string> = {
  'à repassar': 'À Repassar',
  garantido: 'Garantido',
  recebido: 'Recebido',
  'em análise': 'Em Análise',
  'pgto agendado': 'Pgto Agendado',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  'à repassar': 'secondary',
  garantido: 'default',
  recebido: 'default',
  'em análise': 'secondary',
  'pgto agendado': 'secondary',
}

type SortDirection = 'asc' | 'desc' | null

export default function Folders() {
  const { toast } = useToast()
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editFolder, setEditFolder] = useState<FolderRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [repassingId, setRepassingId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlStatus = searchParams.get('status')
  const [tab, setTab] = useState<'a_repassar' | 'repassadas' | 'todas'>('todas')

  const [filterInsurerId, setFilterInsurerId] = useState('all')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')
  const [filterMinValue, setFilterMinValue] = useState('')
  const [filterMaxValue, setFilterMaxValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters =
    filterInsurerId !== 'all' ||
    filterDateStart !== '' ||
    filterDateEnd !== '' ||
    filterMinValue !== '' ||
    filterMaxValue !== ''

  const clearFilters = () => {
    setFilterInsurerId('all')
    setFilterDateStart('')
    setFilterDateEnd('')
    setFilterMinValue('')
    setFilterMaxValue('')
  }

  useEffect(() => {
    if (urlStatus === 'à repassar') setTab('a_repassar')
    else if (urlStatus === 'garantido') setTab('repassadas')
    else if (urlStatus) setTab('todas')
  }, [urlStatus])

  useEffect(() => {
    getInsurers()
      .then(setInsurers)
      .catch(() => {})
  }, [])

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

  useRealtime('folders', () => {
    loadData()
  })

  const handleEdit = (folder: FolderRecord) => {
    setEditFolder(folder)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setEditFolder(null)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteFolder(deleteId)
      toast({ title: 'Sucesso', description: 'Pasta excluída.' })
      loadData()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const handleRepass = async (folder: FolderRecord) => {
    setRepassingId(folder.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      await updateFolder(folder.id, {
        status: 'garantido',
        repassed_date: today,
      })
      toast({ title: 'Sucesso', description: 'Pasta garantida com sucesso.' })
      loadData()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao repassar.', variant: 'destructive' })
    } finally {
      setRepassingId(null)
    }
  }

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === null) return 'asc'
      if (prev === 'asc') return 'desc'
      return null
    })
  }

  const filtered = useMemo(() => {
    let result = folders
    if (urlStatus) {
      result = result.filter((f) => f.status === urlStatus)
    } else if (tab === 'a_repassar') {
      result = result.filter((f) => f.status === 'à repassar')
    } else if (tab === 'repassadas') {
      result = result.filter((f) => f.status !== 'à repassar')
    }

    if (filterInsurerId !== 'all') {
      result = result.filter((f) => f.insurer_id === filterInsurerId)
    }
    if (filterDateStart) {
      result = result.filter((f) => {
        const d = (f.repassed_date || '').split(' ')[0]
        return d >= filterDateStart
      })
    }
    if (filterDateEnd) {
      result = result.filter((f) => {
        const d = (f.repassed_date || '').split(' ')[0]
        return d <= filterDateEnd
      })
    }
    if (filterMinValue) {
      const min = parseFloat(filterMinValue)
      if (!isNaN(min)) {
        result = result.filter((f) => computeRepassValue(f) >= min)
      }
    }
    if (filterMaxValue) {
      const max = parseFloat(filterMaxValue)
      if (!isNaN(max)) {
        result = result.filter((f) => computeRepassValue(f) <= max)
      }
    }

    const q = search.toLowerCase()
    return result.filter(
      (f) =>
        f.contract_number?.toLowerCase().includes(q) ||
        f.owner_name?.toLowerCase().includes(q) ||
        f.expand?.investor_id?.name?.toLowerCase().includes(q),
    )
  }, [
    folders,
    search,
    tab,
    urlStatus,
    filterInsurerId,
    filterDateStart,
    filterDateEnd,
    filterMinValue,
    filterMaxValue,
  ])

  const sorted = useMemo(() => {
    if (!sortDirection) return filtered
    return [...filtered].sort((a, b) => {
      const dateA = a.repassed_date || ''
      const dateB = b.repassed_date || ''
      if (sortDirection === 'asc') return dateA.localeCompare(dateB)
      return dateB.localeCompare(dateA)
    })
  }, [filtered, sortDirection])

  const handleExportExcel = () => {
    const rows = sorted.map((f) => [
      f.contract_number,
      f.owner_name || '-',
      f.expand?.investor_id?.name || '-',
      f.expand?.insurer_id?.name || '-',
      formatNumber(computeRepassValue(f)),
      f.due_date ? formatDate(f.due_date) : '-',
      statusLabels[f.status] || f.status,
      f.repassed_date ? formatDate(f.repassed_date) : '-',
    ])
    exportToXlsx(
      'pastas.xlsx',
      [
        'Contrato',
        'Proprietário',
        'Investidor',
        'Seguradora',
        'Valor Repasse',
        'Vencimento',
        'Status',
        'Repassado',
      ],
      rows,
      { sheetName: 'Pastas' },
    )
    toast({ title: 'Sucesso', description: 'Excel exportado.' })
  }

  const handleExportCsv = () => {
    const rows = sorted.map((f) => [
      f.contract_number,
      f.owner_name || '-',
      f.expand?.investor_id?.name || '-',
      f.expand?.insurer_id?.name || '-',
      formatNumber(computeRepassValue(f)),
      f.due_date ? formatDate(f.due_date) : '-',
      statusLabels[f.status] || f.status,
      f.repassed_date ? formatDate(f.repassed_date) : '-',
    ])
    exportToCsv(
      'pastas.csv',
      [
        'Contrato',
        'Proprietário',
        'Investidor',
        'Seguradora',
        'Valor Repasse',
        'Vencimento',
        'Status',
        'Repassado',
      ],
      rows,
    )
    toast({ title: 'Sucesso', description: 'CSV exportado.' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-0">
            <LoadingRows count={6} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pastas</h1>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" /> Nova Pasta
          </Button>
        </div>
        <ErrorState onRetry={loadData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pastas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={sorted.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={handleExportCsv} disabled={sorted.length === 0}>
            <FileDown className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" /> Nova Pasta
          </Button>
        </div>
      </div>

      {folders.length === 0 ? (
        <EmptyState
          message="Nenhuma pasta cadastrada ainda."
          icon={FolderCog}
          action={
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" /> Cadastrar primeira pasta
            </Button>
          }
        />
      ) : (
        <>
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as 'a_repassar' | 'repassadas' | 'todas')
              if (urlStatus) {
                searchParams.delete('status')
                setSearchParams(searchParams)
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="a_repassar">À Repassar</TabsTrigger>
              <TabsTrigger value="repassadas">Repassadas</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por contrato, proprietário ou investidor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
                <Filter className="mr-2 h-4 w-4" />
                Filtros Avançados
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Ativos
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" /> Limpar filtros
                </Button>
              )}
            </div>
            {showFilters && (
              <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Seguradora</label>
                  <Select value={filterInsurerId} onValueChange={setFilterInsurerId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas" />
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
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Período (De)</label>
                  <Input
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Período (Até)</label>
                  <Input
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Faixa de Valor (R$)</label>
                  <div className="flex items-center gap-1">
                    <CurrencyInput
                      placeholder="0,00"
                      value={filterMinValue}
                      onValueChange={setFilterMinValue}
                      className="w-full"
                    />
                    <span className="text-muted-foreground">—</span>
                    <CurrencyInput
                      placeholder="0,00"
                      value={filterMaxValue}
                      onValueChange={setFilterMaxValue}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {sorted.length === 0 ? (
            <EmptyState message="Nenhuma pasta encontrada com os filtros aplicados." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Contrato</th>
                        <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                        <th className="px-4 py-3 text-left font-medium">Valor</th>
                        <th className="px-4 py-3 text-left font-medium">Vencimento</th>
                        <th className="px-4 py-3 text-left font-medium">Valor Repasse</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">
                          <button
                            onClick={toggleSort}
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            Repassado
                            {sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sortDirection === 'desc' ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((folder) => (
                        <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                          <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                          <td className="px-4 py-3">{formatCurrency(folder.rent_amount || 0)}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {folder.due_date ? formatDate(folder.due_date) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(computeRepassValue(folder))}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariants[folder.status] || 'secondary'}>
                              {statusLabels[folder.status] || folder.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {folder.repassed_date ? formatDate(folder.repassed_date) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRepass(folder)}
                                disabled={
                                  folder.status !== 'à repassar' || repassingId === folder.id
                                }
                                title={folder.status !== 'à repassar' ? 'Já garantido' : 'Garantir'}
                              >
                                {folder.status !== 'à repassar' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(folder)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(folder.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <FolderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        folder={editFolder}
        onSaved={loadData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pasta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A pasta será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
