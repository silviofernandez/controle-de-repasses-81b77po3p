import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, Trash2, FolderCog } from 'lucide-react'
import { getFolders, deleteFolder, type FolderRecord } from '@/services/folders'
import { FolderFormDialog } from '@/components/FolderFormDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate } from '@/lib/format'
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
  pendente: 'Pendente',
  transferido: 'Transferido',
  subido: 'Subido',
  recebido: 'Recebido',
  repassado: 'Repassado',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pendente: 'secondary',
  transferido: 'default',
  subido: 'secondary',
  recebido: 'default',
  repassado: 'default',
}

export default function Folders() {
  const { toast } = useToast()
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editFolder, setEditFolder] = useState<FolderRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const filtered = folders.filter(
    (f) =>
      f.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
      f.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.expand?.investor_id?.name?.toLowerCase().includes(search.toLowerCase()),
  )

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
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Pasta
        </Button>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por contrato, proprietário ou investidor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filtered.length === 0 ? (
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
                        <th className="px-4 py-3 text-left font-medium">Investidor</th>
                        <th className="px-4 py-3 text-left font-medium">Valor</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Criado</th>
                        <th className="px-4 py-3 text-right font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((folder) => (
                        <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                          <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                          <td className="px-4 py-3">{folder.expand?.investor_id?.name || '-'}</td>
                          <td className="px-4 py-3">{formatCurrency(folder.rent_amount || 0)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariants[folder.status] || 'secondary'}>
                              {statusLabels[folder.status] || folder.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(folder.created)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
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
