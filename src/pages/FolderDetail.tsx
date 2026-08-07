import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Pencil, FileText, Wallet } from 'lucide-react'
import { getFolder, type FolderRecord } from '@/services/folders'
import { formatCurrency, formatDate } from '@/lib/format'
import { ErrorState, EmptyState } from '@/components/page-states'
import { FolderFormDialog } from '@/components/FolderFormDialog'
import { ReceiptDialog } from '@/components/ReceiptDialog'

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  transferido: 'Transferido',
  subido: 'Subido',
  recebido: 'Recebido',
  repassado: 'Repassado',
}

export default function FolderDetail() {
  const { id } = useParams<{ id: string }>()
  const [folder, setFolder] = useState<FolderRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getFolder(id)
      setFolder(data)
      setError(false)
    } catch {
      setError(true)
      setFolder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !folder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/folders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detalhes da Pasta</h1>
        </div>
        {error ? (
          <ErrorState
            message="Não foi possível carregar os detalhes da pasta."
            onRetry={loadData}
          />
        ) : (
          <EmptyState message="Pasta não encontrada." icon={FileText} />
        )}
      </div>
    )
  }

  const fields = [
    { label: 'Número do Contrato', value: folder.contract_number },
    { label: 'Proprietário', value: folder.owner_name || '-' },
    { label: 'Investidor', value: folder.expand?.investor_id?.name || '-' },
    { label: 'Seguradora', value: folder.expand?.insurer_id?.name || '-' },
    { label: 'Valor do Aluguel', value: formatCurrency(folder.rent_amount || 0) },
    {
      label: 'Valor Recebido',
      value: folder.received_amount ? formatCurrency(folder.received_amount) : '-',
    },
    { label: 'Repasse do Investidor', value: formatCurrency(folder.investor_share_amount || 0) },
    { label: 'Data Inicial', value: formatDate(folder.initial_date) },
    { label: 'Data de Vencimento', value: formatDate(folder.due_date) },
    { label: 'Transferência ao Proprietário', value: formatDate(folder.owner_transfer_date) },
    { label: 'Envio à Seguradora', value: formatDate(folder.insurer_submission_date) },
    { label: 'Recebimento Previsto', value: formatDate(folder.estimated_receipt_date) },
    { label: 'Recebimento Real', value: formatDate(folder.actual_receipt_date) },
    { label: 'Data do Repasse', value: formatDate(folder.repassed_date) },
    ...(folder.manual_repass_value && folder.manual_repass_value > 0
      ? [{ label: 'Valor do Repasse (Manual)', value: formatCurrency(folder.manual_repass_value) }]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/folders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{folder.contract_number}</h1>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Editar
        </Button>
        {folder.status !== 'repassado' && (
          <Button variant="default" size="sm" onClick={() => setReceiptOpen(true)}>
            <Wallet className="mr-2 h-4 w-4" /> Registrar Recebimento
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={folder.status === 'repassado' ? 'default' : 'secondary'}>
          {statusLabels[folder.status] || folder.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Pasta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label} className="flex flex-col gap-1 border-b pb-2">
                <span className="text-sm text-muted-foreground">{field.label}</span>
                <span className="font-medium">{field.value}</span>
              </div>
            ))}
          </div>
          {folder.notes && (
            <div className="mt-4 flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Observações</span>
              <span className="whitespace-pre-wrap">{folder.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <FolderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        folder={folder}
        onSaved={loadData}
      />

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        folderId={folder.id}
        rentAmount={folder.rent_amount || 0}
        onSaved={loadData}
      />
    </div>
  )
}
