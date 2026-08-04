import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderCog, Wallet, Clock, CheckCircle2, Plus, Inbox } from 'lucide-react'
import { getFolders, type FolderRecord } from '@/services/folders'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency, formatDate } from '@/lib/format'
import { LoadingCards, ErrorState, EmptyState } from '@/components/page-states'

export default function Dashboard() {
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <LoadingCards count={4} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error) {
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

  const pending = folders.filter((f) => f.status === 'pendente')
  const completed = folders.filter((f) => f.status === 'repassado')
  const totalRent = folders.reduce((sum, f) => sum + (f.rent_amount || 0), 0)
  const totalInvestorShare = folders.reduce((sum, f) => sum + (f.investor_share_amount || 0), 0)

  const stats = [
    { title: 'Total de Pastas', value: folders.length, icon: FolderCog, color: 'text-blue-600' },
    { title: 'Pendentes', value: pending.length, icon: Clock, color: 'text-orange-600' },
    { title: 'Repassadas', value: completed.length, icon: CheckCircle2, color: 'text-green-600' },
    {
      title: 'Valor Total',
      value: formatCurrency(totalRent),
      icon: Wallet,
      color: 'text-purple-600',
    },
  ]

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pastas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {folders.slice(0, 5).map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{folder.contract_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {folder.expand?.investor_id?.name || 'N/A'} • {formatDate(folder.created)}
                    </p>
                  </div>
                  <Badge variant={folder.status === 'repassado' ? 'default' : 'secondary'}>
                    {folder.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor Total de Aluguéis</span>
              <span className="font-semibold">{formatCurrency(totalRent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de Repasses aos Investidores</span>
              <span className="font-semibold">{formatCurrency(totalInvestorShare)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Diferença</span>
              <span className="font-bold">{formatCurrency(totalRent - totalInvestorShare)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'
