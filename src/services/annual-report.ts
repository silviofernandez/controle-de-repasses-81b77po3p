import pb from '@/lib/pocketbase/client'

export interface AnnualReportMonthly {
  month: number
  month_label: string
  total_repasse: number
  total_received: number
  profit: number
  investor_share: number
  company_share: number
}

export interface AnnualReportInvestor {
  investor_id: string
  investor_name: string
  total_repasse: number
  total_received: number
  profit: number
  investor_share: number
  company_share: number
  folder_count: number
  monthly: AnnualReportMonthly[]
}

export interface AnnualReportTotals {
  total_repasse: number
  total_received: number
  profit: number
  investor_share: number
  company_share: number
  folder_count: number
}

export interface AnnualReport {
  year: number
  investors: AnnualReportInvestor[]
  totals: AnnualReportTotals
  totals_monthly: AnnualReportMonthly[]
}

export const getAnnualReport = async (year: number): Promise<AnnualReport> => {
  return await pb.send(`/backend/v1/reports/annual?year=${year}`, { method: 'GET' })
}
