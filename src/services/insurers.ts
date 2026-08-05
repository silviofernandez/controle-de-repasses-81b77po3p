import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import { getErrorMessage } from '@/lib/pocketbase/errors'

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

export const createInsurer = async (data: Partial<InsurerRecord>): Promise<InsurerRecord> => {
  const nameTrimmed = data.name?.trim() || ''
  const contactNameTrimmed = data.contact_name?.trim() || ''
  const contactEmailTrimmed = data.contact_email?.trim() || ''
  const contactPhoneTrimmed = data.contact_phone?.trim() || ''

  if (!nameTrimmed) {
    throw new Error('O nome da seguradora é obrigatório.')
  }

  try {
    const existing = await pb.collection('insurers').getFirstListItem(`name = "${nameTrimmed}"`)
    if (existing) {
      throw new Error('Esta seguradora já está cadastrada.')
    }
  } catch (err: any) {
    if (err?.message === 'Esta seguradora já está cadastrada.') {
      throw err
    }
  }

  const payload: Record<string, any> = {
    name: nameTrimmed,
  }
  if (contactNameTrimmed) payload.contact_name = contactNameTrimmed
  if (contactEmailTrimmed) payload.contact_email = contactEmailTrimmed
  if (contactPhoneTrimmed) payload.contact_phone = contactPhoneTrimmed

  try {
    return await pb.collection('insurers').create<InsurerRecord>(payload)
  } catch (err: any) {
    const msg = getErrorMessage(err)
    if (msg.includes('cadastrado') || msg.toLowerCase().includes('unique')) {
      throw new Error('Esta seguradora já está cadastrada.')
    }
    throw new Error(msg)
  }
}

export const updateInsurer = async (
  id: string,
  data: Partial<InsurerRecord>,
): Promise<InsurerRecord> => {
  try {
    return await pb.collection('insurers').update<InsurerRecord>(id, data)
  } catch (err: any) {
    throw new Error(getErrorMessage(err))
  }
}

export const deleteInsurer = async (id: string): Promise<void> => {
  try {
    await pb.collection('insurers').delete(id)
  } catch (err: any) {
    throw new Error(getErrorMessage(err))
  }
}
