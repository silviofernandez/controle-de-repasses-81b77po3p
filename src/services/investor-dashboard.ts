import pb from '@/lib/pocketbase/client'

export interface StatementFolder {
  id: string
  contract_number: string
  owner_name: string
  insurer_name: string
  owner_transfer_date: string
  actual_receipt_date: string
  investor_share_amount: number
  received_amount: number
  status: string
  days_open: number
  days_to_return: number
  percentage_diff: number
}

export interface InvestorStatement {
  total_guaranteed: number
  total_open: number
  received_this_month: number
  total_to_receive: number
  average_ratio: number
  folders: StatementFolder[]
}

export interface UpcomingPayment {
  id: string
  contract_number: string
  owner_name: string
  insurer_name: string
  owner_transfer_date: string
  investor_share_amount: number
}

export const getInvestorStatement = async (): Promise<InvestorStatement> => {
  return await pb.send('/backend/v1/investors/statement', { method: 'GET' })
}

export const getInvestorUpcomingPayments = async (): Promise<UpcomingPayment[]> => {
  return await pb.send('/backend/v1/investors/upcoming-payments', { method: 'GET' })
}
