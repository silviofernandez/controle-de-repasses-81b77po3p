import pb from '@/lib/pocketbase/client'

export type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

export interface ReportIndicators {
  total_paid_to_owners: number
  total_received_from_insurers: number
  total_investor_share: number
  total_company_share: number
}

export interface ReportFolder {
  id: string
  contract_number: string
  owner_name: string
  insurer_name: string
  status: string
  repassed_date: string
  due_date: string
  estimated_receipt_date: string
  actual_receipt_date: string
  investor_share_amount: number
  received_amount: number
  rent_amount: number
  manual_repass_value: number
  punctuality_discount: number
}

export interface GestorReport {
  indicators: ReportIndicators
  open_folders: ReportFolder[]
  closed_folders: ReportFolder[]
  total_folders: number
}

export const STATUS_INFO: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  transferido: { label: 'Transferido', className: 'bg-blue-100 text-blue-800' },
  subido: { label: 'Na Seguradora', className: 'bg-purple-100 text-purple-800' },
  recebido: { label: 'Recebido', className: 'bg-green-100 text-green-800' },
  repassado: { label: 'Repassado', className: 'bg-gray-100 text-gray-800' },
}

export const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
  { value: 'personalizado', label: 'Personalizado' },
]

export function getPeriodDates(
  period: PeriodType,
  customStart?: string,
  customEnd?: string,
): { start: string; end: string } {
  const today = new Date()
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  switch (period) {
    case 'hoje':
      return { start: fmt(today), end: fmt(today) }
    case 'semana': {
      const day = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return { start: fmt(monday), end: fmt(sunday) }
    }
    case 'mes':
      return {
        start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      }
    case 'ano':
      return {
        start: fmt(new Date(today.getFullYear(), 0, 1)),
        end: fmt(new Date(today.getFullYear(), 11, 31)),
      }
    case 'personalizado':
      return { start: customStart || '', end: customEnd || '' }
    default:
      return { start: '', end: '' }
  }
}

export const getGestorReport = async (
  startDate: string,
  endDate: string,
  insurerId?: string,
): Promise<GestorReport> => {
  let url = `/backend/v1/reports/gestor?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
  if (insurerId && insurerId !== 'all') {
    url += `&insurer_id=${encodeURIComponent(insurerId)}`
  }
  return await pb.send(url, { method: 'GET' })
}
