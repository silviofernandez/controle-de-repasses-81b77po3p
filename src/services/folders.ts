import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type FolderStatus = 'pendente' | 'transferido' | 'subido' | 'recebido' | 'repassado'

export interface FolderRecord extends RecordModel {
  contract_number: string
  investor_id: string
  insurer_id: string
  initial_date: string
  due_date: string
  owner_transfer_date: string
  insurer_submission_date: string
  estimated_receipt_date: string
  actual_receipt_date: string
  repassed_date: string
  rent_amount: number
  investor_share_amount: number
  status: FolderStatus
  user_id: string
  notes: string
  owner_name: string
  expand?: {
    investor_id?: { id: string; name: string; email: string }
    insurer_id?: { id: string; name: string }
  }
}

export const getFolders = async (): Promise<FolderRecord[]> => {
  return await pb.collection('folders').getFullList<FolderRecord>({
    sort: '-created',
    expand: 'investor_id,insurer_id',
  })
}

export const getFolder = async (id: string): Promise<FolderRecord> => {
  return await pb.collection('folders').getOne<FolderRecord>(id, {
    expand: 'investor_id,insurer_id',
  })
}

export const createFolder = async (data: Partial<FolderRecord>) => {
  return await pb.collection('folders').create<FolderRecord>(data)
}

export const updateFolder = async (id: string, data: Partial<FolderRecord>) => {
  return await pb.collection('folders').update<FolderRecord>(id, data)
}

export const deleteFolder = async (id: string) => {
  await pb.collection('folders').delete(id)
}

export const getFoldersByStatus = async (status: FolderStatus): Promise<FolderRecord[]> => {
  return await pb.collection('folders').getFullList<FolderRecord>({
    filter: `status = "${status}"`,
    sort: '-created',
    expand: 'investor_id,insurer_id',
  })
}
