import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { getAnnualReport, type AnnualReport as AnnualReportType } from '@/services/annual-report'
import { useRealtime } from '@/hooks/use-realtime'
import { formatCurrency } from '@/lib/format'
import { exportToXlsx } from '@/lib/xlsx-export'
import { exportToCsv } from '@/lib/csv-export'
import { LoadingRows, ErrorState, EmptyState } from '@/components/page-states'

function getAvailableYears(): number[] {
  const current = new Date().getFullYear()
  return [current, current - 1, current - 2, current - 3]
}

export function AnnualReportSection() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [report, setReport] = useState<AnnualReportType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAnnualReport(year)
      setReport(data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('folders', () => loadData())

  const buildRows = () => {
    if (!report) return []
    const rows = report.investors.map((inv) => [
      inv.investor_name,
      formatCurrency(inv.total_repasse),
      formatCurrency(inv.total_received),
      formatCurrency(inv.profit),
      formatCurrency(inv.investor_share),
      formatCurrency(inv.company_share),
      inv.folder_count,
    ])
    rows.push([
      'TOTAL',
      formatCurrency(report.totals.total_repasse),
      formatCurrency(report.totals.total_received),
      formatCurrency(report.totals.profit),
      formatCurrency(report.totals.investor_share),
      formatCurrency(report.totals.company_share),
      report.totals.folder_count,
    ])
    return rows
  }

  const headers = [
    'Investidor',
    'Total Repasse',
    'Total Recebido',
    'Lucro (20%)',
    'Investidor (5%)',
    'Imobiliária (15%)',
    'Pastas',
  ]

  const handleExportExcel = () => {
    if (!report) return
    exportToXlsx(`relatorio-anual-${report.year}.xlsx`, headers, buildRows(), {
      sheetName: `Relatório ${report.year}`,
    })
  }

  const handleExportCsv = () => {
    if (!report) return
    exportToCsv(`relatorio-anual-${report.year}.csv`, headers, buildRows())
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <LoadingRows count={5} />
      </div>
    )
  }

  if (error) {
    return <ErrorState message="Não foi possível carregar o relatório anual." onRetry={loadData} />
  }

  if (!report || report.investors.length === 0) {
    return (
      <div className="space-y-4">
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableYears().map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <EmptyState message={`Nenhum dado encontrado para ${year}.`} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v, 10))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableYears().map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
          <Button variant="outline" onClick={handleExportCsv}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatório Anual Consolidado — {report.year}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Investidor</th>
                  <th className="px-4 py-3 text-right font-medium">Total Repasse</th>
                  <th className="px-4 py-3 text-right font-medium">Total Recebido</th>
                  <th className="px-4 py-3 text-right font-medium">Lucro (20%)</th>
                  <th className="px-4 py-3 text-right font-medium">Investidor (5%)</th>
                  <th className="px-4 py-3 text-right font-medium">Imobiliária (15%)</th>
                  <th className="px-4 py-3 text-right font-medium">Pastas</th>
                </tr>
              </thead>
              <tbody>
                {report.investors.map((inv) => (
                  <tr key={inv.investor_id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{inv.investor_name}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(inv.total_repasse)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(inv.total_received)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatCurrency(inv.profit)}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-600">
                      {formatCurrency(inv.investor_share)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      {formatCurrency(inv.company_share)}
                    </td>
                    <td className="px-4 py-3 text-right">{inv.folder_count}</td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-muted/30 font-bold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(report.totals.total_repasse)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(report.totals.total_received)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatCurrency(report.totals.profit)}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-600">
                    {formatCurrency(report.totals.investor_share)}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {formatCurrency(report.totals.company_share)}
                  </td>
                  <td className="px-4 py-3 text-right">{report.totals.folder_count}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
