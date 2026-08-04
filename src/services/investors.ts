import pb from '@/lib/pocketbase/client'

export interface Investor {
  id: string
  name: string
  email: string
  phone: string
  document: string
}

export const getInvestors = () =>
  pb.collection('investors').getFullList({ sort: 'name' }) as Promise<Investor[]>
export const getInvestor = (id: string) => pb.collection('investors').getOne(id)
export const createInvestor = (data: {
  name: string
  user_id?: string
  email?: string
  phone?: string
  document?: string
}) => pb.collection('investors').create(data)
export const updateInvestor = (
  id: string,
  data: Partial<{ name: string; email: string; phone: string; document: string }>,
) => pb.collection('investors').update(id, data)
export const deleteInvestor = (id: string) => pb.collection('investors').delete(id)
