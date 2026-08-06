import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ShieldCheck,
  Clock,
  TrendingUp,
  Wallet,
  BarChart3,
  CalendarClock,
  TrendingDown,
  FileDown,
} from 'lucide-react'
import {
  getInvestorStatement,
  type InvestorStatement,
  type StatementFolder,
} from '@/services/investor-dashboard'
import { formatCurrency, formatDate } from '@/lib/format'
import { LoadingCards, ErrorState, EmptyState } from '@/components/page-states'
import { printDocument } from '@/lib/pdf-export'

export default function InvestorDashboard() {
  const [statement, setStatement] = useState<InvestorStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    setLoading(true)
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
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <LoadingCards count={5} />
      </div>
    )
  }

  if (error) {
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
        <ErrorState message="Não foi possível carregar seus dados." onRetry={loadData} />
      </div>
    )
  }

  if (!statement) {
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
        <EmptyState message="Ainda não existem movimentações para exibir." icon={TrendingDown} />
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

  const handleExportPDF = () => {
    const rows = (statement.folders || []).map((f: StatementFolder) => ({
      contrato: f.contract_number,
      proprietario: f.owner_name || '-',
      seguradora: f.insurer_name || '-',
      data_repasse: formatDate(f.owner_transfer_date),
      valor_repassado: formatCurrency(f.investor_share_amount),
      dias_aberto: f.status === 'recebido' ? `${f.days_to_return} dias` : `${f.days_open} dias`,
      valor_recebido: f.received_amount ? formatCurrency(f.received_amount) : '-',
      pct_diff:
        f.received_amount > 0
          ? `${f.percentage_diff >= 0 ? '+' : ''}${f.percentage_diff.toFixed(1)}%`
          : '-',
    }))

    printDocument(
      'Extrato do Investidor',
      [
        {
          columns: [
            { header: 'Contrato', key: 'contrato' },
            { header: 'Proprietário', key: 'proprietario' },
            { header: 'Seguradora', key: 'seguradora' },
            { header: 'Data Repasse', key: 'data_repasse' },
            { header: 'Valor Repassado', key: 'valor_repassado' },
            { header: 'Dias', key: 'dias_aberto' },
            { header: 'Valor Recebido', key: 'valor_recebido' },
            { header: '% Diff', key: 'pct_diff' },
          ],
          rows,
        },
      ],
      [
        { label: 'Valor Total Garantido', value: formatCurrency(statement.total_guaranteed) },
        { label: 'Valor em Aberto', value: formatCurrency(statement.total_open) },
        { label: 'Recebido no Mês', value: formatCurrency(statement.received_this_month) },
        { label: 'Total a Receber', value: formatCurrency(statement.total_to_receive) },
        { label: 'Média Recebida', value: `${statement.average_ratio.toFixed(1)}%` },
      ],
    )
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pendente: 'Pendente',
      transferido: 'Transferido',
      subido: 'Na Seguradora',
      recebido: 'Recebido',
      repassado: 'Repassado',
    }
    return map[status] || status
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meu Painel</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button asChild variant="outline">
            <Link to="/investor-upcoming">
              <CalendarClock className="mr-2 h-4 w-4" /> Próximos Repasses
            </Link>
          </Button>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Extrato Detalhado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!statement.folders || statement.folders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada.
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
                    <th className="px-4 py-3 text-left font-medium">Valor Recebido</th>
                    <th className="px-4 py-3 text-left font-medium">Dias p/ Retorno</th>
                    <th className="px-4 py-3 text-left font-medium">% Diferença</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.folders.map((folder) => (
                    <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                      <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                      <td className="px-4 py-3">{folder.insurer_name || '-'}</td>
                      <td className="px-4 py-3">{formatDate(folder.owner_transfer_date)}</td>
                      <td className="px-4 py-3">{formatCurrency(folder.investor_share_amount)}</td>
                      <td className="px-4 py-3">{folder.days_open} dias</td>
                      <td className="px-4 py-3">
                        {folder.received_amount ? formatCurrency(folder.received_amount) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {folder.days_to_return > 0 ? `${folder.days_to_return} dias` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {folder.received_amount > 0 ? (
                          <span
                            className={
                              folder.percentage_diff >= 0
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {folder.percentage_diff >= 0 ? '+' : ''}
                            {folder.percentage_diff.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={folder.status === 'recebido' ? 'default' : 'secondary'}>
                          {statusLabel(folder.status)}
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
