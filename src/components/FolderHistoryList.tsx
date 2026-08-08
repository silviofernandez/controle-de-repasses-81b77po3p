import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { History, ArrowRight } from 'lucide-react'
import { getFolderHistory, type FolderHistoryRecord } from '@/services/folder-history'
import { formatCurrency, formatDate } from '@/lib/format'
import { useRealtime } from '@/hooks/use-realtime'

const fieldLabels: Record<string, string> = {
  received_amount: 'Valor Recebido',
  estimated_receipt_date: 'Data Prevista de Recebimento',
}

function formatValue(field: string, value: string): string {
  if (!value) return '-'
  if (field === 'received_amount') return formatCurrency(parseFloat(value) || 0)
  return formatDate(value)
}

export function FolderHistoryList({ folderId }: { folderId: string }) {
  const [history, setHistory] = useState<FolderHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getFolderHistory(folderId)
      setHistory(data)
    } catch {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [folderId])

  useRealtime('folder_history', () => loadData())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma alteração registrada.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {fieldLabels[item.field_name] || item.field_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.created)} —{' '}
                    {item.expand?.changed_by?.name || item.expand?.changed_by?.email || 'Sistema'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground line-through">
                    {formatValue(item.field_name, item.old_value)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatValue(item.field_name, item.new_value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
