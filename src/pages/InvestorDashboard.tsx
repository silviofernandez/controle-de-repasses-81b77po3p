import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ShieldCheck,
  Clock,
  TrendingUp,
  Wallet,
  BarChart3,
  AlertCircle,
  CalendarClock,
} from 'lucide-react'
import { getInvestorStatement, type InvestorStatement } from '@/services/investor-dashboard'
import { formatCurrency } from '@/lib/format'

export default function InvestorDashboard() {
  const [statement, setStatement] = useState<InvestorStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    try {
      const data = await getInvestorStatement()
      setStatement(data)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !statement) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Não foi possível carregar seus dados.</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  const stats = [
    {
      title: 'Valor Total Garantido',
      value: formatCurrency(statement.total_guaranteed),
      icon: ShieldCheck,
      color: 'text-blue-600',
    },
    {
      title: 'Valor em Aberto',
      value: formatCurrency(statement.total_open),
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'Recebido no Mês',
      value: formatCurrency(statement.received_this_month),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Total a Receber',
      value: formatCurrency(statement.total_to_receive),
      icon: Wallet,
      color: 'text-purple-600',
    },
    {
      title: 'Média Recebida',
      value: `${statement.average_ratio.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-cyan-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meu Painel</h1>
        <Button asChild variant="outline">
          <Link to="/investor-upcoming">
            <CalendarClock className="mr-2 h-4 w-4" /> Próximos Repasses
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  )
}
