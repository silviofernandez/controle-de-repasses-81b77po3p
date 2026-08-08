import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wallet, AlertCircle, Search, Pencil, Trash2, FileDown, Download } from 'lucide-react'
import { getFolders, updateFolder, type FolderRecord } from '@/services/folders'
import { RepassEditDialog } from '@/components/RepassEditDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { printComprovante } from '@/lib/pdf-export'
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

function calcRepassValue(folder: FolderRecord): number {
  if (folder.manual_repass_value && folder.manual_repass_value > 0) {
    return folder.manual_repass_value
  }
  const rent = folder.rent_amount || 0
  const discount = folder.punctuality_discount || 0
  const adminFee = rent * 0.1
  return rent - discount - adminFee
}

function calcAdminFee(folder: FolderRecord): number {
  return (folder.rent_amount || 0) * 0.1
}

const statusLabels: Record<string, string> = {
  'à repassar': 'À Repassar',
  garantido: 'Garantido',
  recebido: 'Recebido',
  'em análise': 'Em Análise',
  'pgto agendado': 'Pgto Agendado',
}

export default function Payments() {
  const { toast } = useToast()
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editFolder, setEditFolder] = useState<FolderRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadData = async () => {
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

  const repassedFolders = useMemo(() => {
    return folders.filter((f) => f.status === 'garantido')
  }, [folders])

  const filtered = useMemo(() => {
    let result = repassedFolders

    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(
        (f) =>
          f.contract_number?.toLowerCase().includes(q) || f.owner_name?.toLowerCase().includes(q),
      )
    }

    if (dateFrom) {
      result = result.filter((f) => {
        const d = f.repassed_date ? f.repassed_date.split(' ')[0] : ''
        return d >= dateFrom
      })
    }

    if (dateTo) {
      result = result.filter((f) => {
        const d = f.repassed_date ? f.repassed_date.split(' ')[0] : ''
        return d <= dateTo
      })
    }

    return result
  }, [repassedFolders, search, dateFrom, dateTo])

  const totalRepassed = filtered.reduce((sum, f) => sum + calcRepassValue(f), 0)

  const handleRemove = async () => {
    if (!deleteId) return
    setRemovingId(deleteId)
    try {
      await updateFolder(deleteId, {
        status: 'à repassar',
        repassed_date: null,
      })
      toast({ title: 'Sucesso', description: 'Repasse removido. Pasta voltou para À Repassar.' })
      loadData()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao remover repasse.', variant: 'destructive' })
    } finally {
      setRemovingId(null)
      setDeleteId(null)
    }
  }

  const hasFilters = search || dateFrom || dateTo

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
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
        <h1 className="text-2xl font-bold">Repasses</h1>
        <ErrorState message="Não foi possível carregar os repasses." onRetry={loadData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Repasses</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Repasses</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRepassed)}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quantidade de Repasses</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Repasses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por contrato ou proprietário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
                placeholder="De"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
                placeholder="Até"
              />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Limpar filtros
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = filtered.map((f) => [
                  f.contract_number,
                  f.owner_name || '-',
                  formatNumber(calcRepassValue(f)),
                  f.repassed_date ? formatDate(f.repassed_date) : '-',
                  statusLabels[f.status] || f.status,
                ])
                exportToCsv(
                  'repasses.csv',
                  ['Contrato', 'Proprietário', 'Valor do Repasse', 'Data Repasse', 'Status'],
                  rows,
                )
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>

          {repassedFolders.length === 0 ? (
            <EmptyState message="Nenhum repasse registrado." icon={Wallet} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Nenhum repasse encontrado com os filtros aplicados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Contrato</th>
                    <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                    <th className="px-4 py-3 text-left font-medium">Valor do Repasse</th>
                    <th className="px-4 py-3 text-left font-medium">Data Repasse</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((folder) => (
                    <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                      <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(calcRepassValue(folder))}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {folder.repassed_date ? formatDate(folder.repassed_date) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {statusLabels[folder.status] || folder.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              printComprovante({
                                contractNumber: folder.contract_number,
                                ownerName: folder.owner_name || '-',
                                repassValue: calcRepassValue(folder),
                                repassDate: folder.repassed_date || '',
                                status: statusLabels[folder.status] || folder.status,
                                punctualityDiscount: folder.punctuality_discount || 0,
                                adminFee: calcAdminFee(folder),
                                rentAmount: folder.rent_amount || 0,
                              })
                            }
                            title="Comprovante PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditFolder(folder)}
                            title="Editar repasse"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(folder.id)}
                            disabled={removingId === folder.id}
                            title="Remover repasse"
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
          )}
        </CardContent>
      </Card>

      <RepassEditDialog
        open={!!editFolder}
        onOpenChange={(open) => !open && setEditFolder(null)}
        folder={editFolder}
        onSaved={loadData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover repasse?</AlertDialogTitle>
            <AlertDialogDescription>
              O status da pasta voltará para "Pendente" e a data de repasse será limpa. A pasta
              continuará existindo na aba Pastas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
