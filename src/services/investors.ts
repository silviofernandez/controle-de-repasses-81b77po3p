import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface InvestorRecord extends RecordModel {
  user_id: string
  name: string
  email: string
  phone: string
  document: string
}

export const getInvestors = async (): Promise<InvestorRecord[]> => {
  return await pb.collection('investors').getFullList<InvestorRecord>({
    sort: 'name',
  })
}

export const getInvestor = async (id: string): Promise<InvestorRecord> => {
  return await pb.collection('investors').getOne<InvestorRecord>(id)
}

export const createInvestor = async (data: Partial<InvestorRecord>) => {
  return await pb.collection('investors').create<InvestorRecord>(data)
}

export const updateInvestor = async (id: string, data: Partial<InvestorRecord>) => {
  return await pb.collection('investors').update<InvestorRecord>(id, data)
}

export const deleteInvestor = async (id: string) => {
  await pb.collection('investors').delete(id)
}
