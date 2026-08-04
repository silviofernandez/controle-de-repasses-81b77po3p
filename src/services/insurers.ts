import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface InsurerRecord extends RecordModel {
  name: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

export const getInsurers = async (): Promise<InsurerRecord[]> => {
  return await pb.collection('insurers').getFullList<InsurerRecord>({
    sort: 'name',
  })
}

export const getInsurer = async (id: string): Promise<InsurerRecord> => {
  return await pb.collection('insurers').getOne<InsurerRecord>(id)
}

export const createInsurer = async (data: Partial<InsurerRecord>) => {
  return await pb.collection('insurers').create<InsurerRecord>(data)
}

export const updateInsurer = async (id: string, data: Partial<InsurerRecord>) => {
  return await pb.collection('insurers').update<InsurerRecord>(id, data)
}

export const deleteInsurer = async (id: string) => {
  await pb.collection('insurers').delete(id)
}
