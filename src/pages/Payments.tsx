import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getFolders, type FolderRecord } from '@/services/folders'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/format'

export default function Payments() {
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

  const repassed = folders.filter((f) => f.status === 'repassado')
  const pending = folders.filter((f) => f.status !== 'repassado')
  const totalRepassed = repassed.reduce((sum, f) => sum + (f.investor_share_amount || 0), 0)
  const totalPending = pending.reduce((sum, f) => sum + (f.investor_share_amount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Não foi possível carregar os repasses.</p>
        <Button onClick={loadData}>Tentar novamente</Button>
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
                <p className="text-sm text-muted-foreground">Total Repassado</p>
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
                <p className="text-sm text-muted-foreground">Pendente de Repasse</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
              </div>
              <Wallet className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Repasses</CardTitle>
        </CardHeader>
        <CardContent>
          {folders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum repasse registrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Contrato</th>
                    <th className="px-4 py-3 text-left font-medium">Investidor</th>
                    <th className="px-4 py-3 text-left font-medium">Valor</th>
                    <th className="px-4 py-3 text-left font-medium">Repasse</th>
                    <th className="px-4 py-3 text-left font-medium">Data Repasse</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {folders.map((folder) => (
                    <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                      <td className="px-4 py-3">{folder.expand?.investor_id?.name || '-'}</td>
                      <td className="px-4 py-3">{formatCurrency(folder.rent_amount || 0)}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(folder.investor_share_amount || 0)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {folder.repassed_date ? formatDate(folder.repassed_date) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={folder.status === 'repassado' ? 'default' : 'secondary'}>
                          {folder.status}
                        </Badge>
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
