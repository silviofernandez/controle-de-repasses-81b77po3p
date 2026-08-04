import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CalendarClock, ArrowLeft, Wallet } from 'lucide-react'
import { getInvestorUpcomingPayments, type UpcomingPayment } from '@/services/investor-dashboard'
import { formatCurrency, formatDate } from '@/lib/format'
import { LoadingRows, ErrorState, EmptyState } from '@/components/page-states'

export default function InvestorUpcoming() {
  const [payments, setPayments] = useState<UpcomingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getInvestorUpcomingPayments()
      setPayments(data)
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
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-0">
            <LoadingRows count={4} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/investor-dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Próximos Repasses</h1>
        </div>
        <ErrorState message="Não foi possível carregar os próximos repasses." onRetry={loadData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/investor-dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Próximos Repasses</h1>
      </div>

      {payments.length === 0 ? (
        <EmptyState message="Nenhum pagamento previsto para os próximos dias." icon={Wallet} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Repasses de Amanhã e Depois de Amanhã
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Contrato</th>
                    <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                    <th className="px-4 py-3 text-left font-medium">Seguradora</th>
                    <th className="px-4 py-3 text-left font-medium">Data do Repasse</th>
                    <th className="px-4 py-3 text-left font-medium">Valor ao Investidor</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{payment.contract_number}</td>
                      <td className="px-4 py-3">{payment.owner_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{payment.insurer_name}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(payment.owner_transfer_date)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(payment.investor_share_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
