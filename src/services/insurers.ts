import pb from '@/lib/pocketbase/client'

export interface Insurer {
  id: string
  name: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

export const getInsurers = () =>
  pb.collection('insurers').getFullList({ sort: 'name' }) as Promise<Insurer[]>
export const getInsurer = (id: string) => pb.collection('insurers').getOne(id)
export const createInsurer = (data: {
  name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
}) => pb.collection('insurers').create(data)
export const updateInsurer = (
  id: string,
  data: Partial<{
    name: string
    contact_name: string
    contact_email: string
    contact_phone: string
  }>,
) => pb.collection('insurers').update(id, data)
export const deleteInsurer = (id: string) => pb.collection('insurers').delete(id)
