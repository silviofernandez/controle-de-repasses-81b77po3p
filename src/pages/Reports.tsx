import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, BarChart3 } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from 'recharts'
import { getFolders, type FolderStatus, type FolderRecord } from '@/services/folders'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency } from '@/lib/format'

const STATUS_COLORS: Record<string, string> = {
  pendente: 'hsl(var(--chart-1))',
  transferido: 'hsl(var(--chart-2))',
  subido: 'hsl(var(--chart-3))',
  recebido: 'hsl(var(--chart-4))',
  repassado: 'hsl(var(--chart-5))',
}

export default function Reports() {
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

  useRealtime('folders', () => loadData())

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Não foi possível carregar os relatórios.</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  const statuses: FolderStatus[] = ['pendente', 'transferido', 'subido', 'recebido', 'repassado']
  const statusData = statuses.map((status) => ({
    name: status,
    count: folders.filter((f) => f.status === status).length,
    fill: STATUS_COLORS[status],
  }))

  const investorMap = new Map<string, { name: string; total: number; count: number }>()
  folders.forEach((f) => {
    const name = f.expand?.investor_id?.name || 'N/A'
    const existing = investorMap.get(name) || { name, total: 0, count: 0 }
    existing.total += f.rent_amount || 0
    existing.count += 1
    investorMap.set(name, existing)
  })
  const investorData = Array.from(investorMap.values()).map((item) => ({
    name: item.name,
    total: item.total,
    count: item.count,
  }))

  const chartConfig = {
    count: { label: 'Quantidade' },
    total: { label: 'Total (R$)' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Relatórios</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pastas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor por Investidor</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={investorData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total de Pastas</p>
              <p className="text-xl font-bold">{folders.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold">
                {formatCurrency(folders.reduce((s, f) => s + (f.rent_amount || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Repassado</p>
              <p className="text-xl font-bold">
                {formatCurrency(folders.reduce((s, f) => s + (f.investor_share_amount || 0), 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
