import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Receipt, AlertCircle, Clock, CheckCircle2, Wallet } from 'lucide-react'
import { getFolders, type FolderRecord } from '@/services/folders'
import { ReceiptDialog } from '@/components/ReceiptDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/format'
import { LoadingRows, ErrorState, EmptyState } from '@/components/page-states'

function calcDaysOpen(transferDate: string, receiptDate?: string): number {
  if (!transferDate) return 0
  const start = new Date(transferDate + 'T00:00:00Z')
  const end = receiptDate ? new Date(receiptDate + 'T00:00:00Z') : new Date()
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000))
}

const OVERDUE_THRESHOLD = 55

function isOverdue(repassedDate: string): boolean {
  if (!repassedDate) return false
  const start = new Date(repassedDate + 'T00:00:00Z')
  const now = new Date()
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000))
  return days > OVERDUE_THRESHOLD
}

export default function Receipts() {
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [receiptFolder, setReceiptFolder] = useState<FolderRecord | null>(null)

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

  const awaiting = useMemo(
    () => folders.filter((f) => f.status === 'repassado' || f.status === 'subido'),
    [folders],
  )
  const received = useMemo(() => folders.filter((f) => f.status === 'recebido'), [folders])

  const totalAwaiting = awaiting.reduce((s, f) => s + (f.investor_share_amount || 0), 0)
  const totalReceived = received.reduce((s, f) => s + (f.received_amount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
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
        <h1 className="text-2xl font-bold">Recebimentos</h1>
        <ErrorState message="Não foi possível carregar os recebimentos." onRetry={loadData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recebimentos</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aguardando Recebimento</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalAwaiting)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Aguardando Recebimento ({awaiting.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {awaiting.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma pasta aguardando recebimento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Contrato</th>
                    <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                    <th className="px-4 py-3 text-left font-medium">Seguradora</th>
                    <th className="px-4 py-3 text-left font-medium">Data Repasse</th>
                    <th className="px-4 py-3 text-left font-medium">Valor Repassado</th>
                    <th className="px-4 py-3 text-left font-medium">Dias em Aberto</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {awaiting.map((folder) => {
                    const days = calcDaysOpen(folder.owner_transfer_date)
                    return (
                      <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                        <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                        <td className="px-4 py-3">{folder.expand?.insurer_id?.name || '-'}</td>
                        <td className="px-4 py-3">{formatDate(folder.owner_transfer_date)}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(folder.investor_share_amount || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={days > 30 ? 'destructive' : 'secondary'}>
                            {days} dias
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">
                            {folder.status === 'subido' ? 'Na Seguradora' : 'Repassado'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={isOverdue(folder.repassed_date) ? 'destructive' : 'default'}
                            onClick={() => setReceiptFolder(folder)}
                          >
                            <Receipt className="mr-1 h-4 w-4" /> Receber
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {received.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Recebidos ({received.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Contrato</th>
                    <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                    <th className="px-4 py-3 text-left font-medium">Valor Repassado</th>
                    <th className="px-4 py-3 text-left font-medium">Valor Recebido</th>
                    <th className="px-4 py-3 text-left font-medium">Data Recebimento</th>
                    <th className="px-4 py-3 text-left font-medium">Dias</th>
                    <th className="px-4 py-3 text-left font-medium">% Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {received.map((folder) => {
                    const days = calcDaysOpen(
                      folder.owner_transfer_date,
                      folder.actual_receipt_date,
                    )
                    const pct =
                      folder.investor_share_amount > 0
                        ? (((folder.received_amount || 0) - folder.investor_share_amount) /
                            folder.investor_share_amount) *
                          100
                        : 0
                    return (
                      <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                        <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(folder.investor_share_amount || 0)}
                        </td>
                        <td className="px-4 py-3 font-medium text-green-600">
                          {formatCurrency(folder.received_amount || 0)}
                        </td>
                        <td className="px-4 py-3">{formatDate(folder.actual_receipt_date)}</td>
                        <td className="px-4 py-3">{days} dias</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              pct >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                            }
                          >
                            {pct >= 0 ? '+' : ''}
                            {pct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ReceiptDialog
        open={!!receiptFolder}
        onOpenChange={(open) => !open && setReceiptFolder(null)}
        folderId={receiptFolder?.id || ''}
        rentAmount={receiptFolder?.investor_share_amount || 0}
        onSaved={loadData}
      />
    </div>
  )
}
