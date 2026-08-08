import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { FolderRecord } from '@/services/folders'
import { computeRepassValue } from '@/lib/repass-utils'
import { formatCurrency } from '@/lib/format'

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

interface MonthData {
  month: string
  previsto: number
  realizado: number
}

function getLast12Months(): { label: string; year: number; month: number }[] {
  const result: { label: string; year: number; month: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      label: `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }
  return result
}

function computeMonthlyData(folders: FolderRecord[]): MonthData[] {
  const monthsInfo = getLast12Months()
  return monthsInfo.map(({ label, year, month }) => {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)

    const previsto = folders
      .filter((f) => {
        if (f.status !== 'pgto agendado' || !f.estimated_receipt_date) return false
        const d = new Date(f.estimated_receipt_date)
        return d >= start && d <= end
      })
      .reduce((s, f) => s + computeRepassValue(f) * 1.2, 0)

    const realizado = folders
      .filter((f) => {
        if (f.status !== 'recebido' || !f.actual_receipt_date) return false
        const d = new Date(f.actual_receipt_date)
        return d >= start && d <= end
      })
      .reduce((s, f) => s + (f.received_amount || 0), 0)

    return { month: label, previsto, realizado }
  })
}

const chartConfig = {
  previsto: { label: 'Previsto', color: 'hsl(var(--chart-1))' },
  realizado: { label: 'Realizado', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig

export function ForecastVsRealizedChart({ folders }: { folders: FolderRecord[] }) {
  const data = useMemo(() => computeMonthlyData(folders), [folders])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsto vs. Realizado — Últimos 12 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={80}
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number, name: string) => {
                    const config = chartConfig[name as keyof typeof chartConfig]
                    return (
                      <>
                        <div
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: config?.color }}
                        />
                        <span className="text-muted-foreground">{config?.label || name}</span>
                        <span className="ml-auto font-medium tabular-nums">
                          {formatCurrency(Number(value))}
                        </span>
                      </>
                    )
                  }}
                />
              }
            />
            <Legend />
            <Bar dataKey="previsto" fill="var(--color-previsto)" radius={4} name="Previsto" />
            <Bar dataKey="realizado" fill="var(--color-realizado)" radius={4} name="Realizado" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
