import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { formatCurrency } from '@/lib/format'
import type { AnnualReport } from '@/services/annual-report'

function MonthlyTable({ investor }: { investor: AnnualReport['investors'][0] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Mês</th>
            <th className="px-3 py-2 text-right font-medium">Total Repasse</th>
            <th className="px-3 py-2 text-right font-medium">Total Recebido</th>
            <th className="px-3 py-2 text-right font-medium">Lucro (20%)</th>
            <th className="px-3 py-2 text-right font-medium">Investidor (5%)</th>
            <th className="px-3 py-2 text-right font-medium">Imobiliária (15%)</th>
          </tr>
        </thead>
        <tbody>
          {investor.monthly.map((m) => (
            <tr key={m.month} className="border-b last:border-0 hover:bg-muted/50">
              <td className="px-3 py-2 font-medium">{m.month_label}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(m.total_repasse)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(m.total_received)}</td>
              <td className="px-3 py-2 text-right font-medium text-green-600">
                {formatCurrency(m.profit)}
              </td>
              <td className="px-3 py-2 text-right text-purple-600">
                {formatCurrency(m.investor_share)}
              </td>
              <td className="px-3 py-2 text-right text-orange-600">
                {formatCurrency(m.company_share)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 bg-muted/30 font-bold">
            <td className="px-3 py-2">Total Anual</td>
            <td className="px-3 py-2 text-right">{formatCurrency(investor.total_repasse)}</td>
            <td className="px-3 py-2 text-right">{formatCurrency(investor.total_received)}</td>
            <td className="px-3 py-2 text-right text-green-600">
              {formatCurrency(investor.profit)}
            </td>
            <td className="px-3 py-2 text-right text-purple-600">
              {formatCurrency(investor.investor_share)}
            </td>
            <td className="px-3 py-2 text-right text-orange-600">
              {formatCurrency(investor.company_share)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function AnnualReportMonthly({ report }: { report: AnnualReport }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Mensal por Investidor — {report.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {report.investors.map((inv) => (
              <AccordionItem key={inv.investor_id} value={inv.investor_id}>
                <AccordionTrigger className="font-medium">{inv.investor_name}</AccordionTrigger>
                <AccordionContent>
                  <MonthlyTable investor={inv} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {report.totals_monthly && (
        <Card>
          <CardHeader>
            <CardTitle>Total Mensal Consolidado — {report.year}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Mês</th>
                    <th className="px-3 py-2 text-right font-medium">Total Repasse</th>
                    <th className="px-3 py-2 text-right font-medium">Total Recebido</th>
                    <th className="px-3 py-2 text-right font-medium">Lucro (20%)</th>
                    <th className="px-3 py-2 text-right font-medium">Investidor (5%)</th>
                    <th className="px-3 py-2 text-right font-medium">Imobiliária (15%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.totals_monthly.map((m) => (
                    <tr key={m.month} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{m.month_label}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(m.total_repasse)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(m.total_received)}</td>
                      <td className="px-3 py-2 text-right font-medium text-green-600">
                        {formatCurrency(m.profit)}
                      </td>
                      <td className="px-3 py-2 text-right text-purple-600">
                        {formatCurrency(m.investor_share)}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-600">
                        {formatCurrency(m.company_share)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-muted/30 font-bold">
                    <td className="px-3 py-2">Total Anual</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(report.totals.total_repasse)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(report.totals.total_received)}
                    </td>
                    <td className="px-3 py-2 text-right text-green-600">
                      {formatCurrency(report.totals.profit)}
                    </td>
                    <td className="px-3 py-2 text-right text-purple-600">
                      {formatCurrency(report.totals.investor_share)}
                    </td>
                    <td className="px-3 py-2 text-right text-orange-600">
                      {formatCurrency(report.totals.company_share)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
