import pb from '@/lib/pocketbase/client'

export interface Folder {
  id: string
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
  surcharge_percent: number
  investor_percent: number
  surcharge_amount: number
  company_share_amount: number
  investor_share_amount: number
  status: string
  notes: string
  created: string
  updated: string
  expand?: {
    investor_id?: { id: string; name: string }
    insurer_id?: { id: string; name: string }
  }
}

export const getFolders = async (): Promise<Folder[]> => {
  const res = (await pb.send('/backend/v1/investor-folders', { method: 'GET' })) as {
    items: Folder[]
  }
  return res.items
}

export const getInvestorFolders = () =>
  pb.send('/backend/v1/investor-folders', { method: 'GET' }) as Promise<{ items: Folder[] }>

export const getFolder = (id: string) =>
  pb.send(`/backend/v1/folders/${id}`, { method: 'GET' }) as Promise<Folder>

export const createFolder = (data: Record<string, any>) => pb.collection('folders').create(data)

export const updateFolder = (id: string, data: Record<string, any>) =>
  pb.collection('folders').update(id, data)

export const deleteFolder = (id: string) => pb.collection('folders').delete(id)
