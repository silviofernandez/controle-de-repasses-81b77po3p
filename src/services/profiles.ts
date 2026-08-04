import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface ProfileRecord extends RecordModel {
  user_id: string
  role: 'gestor' | 'investidor'
  name: string
  phone: string
}

export const getProfile = async (userId: string): Promise<ProfileRecord | null> => {
  try {
    return await pb.collection('profiles').getFirstListItem<ProfileRecord>(`user_id = "${userId}"`)
  } catch {
    return null
  }
}

export const createProfile = async (data: Partial<ProfileRecord>) => {
  return await pb.collection('profiles').create<ProfileRecord>(data)
}

export const updateProfile = async (id: string, data: Partial<ProfileRecord>) => {
  return await pb.collection('profiles').update<ProfileRecord>(id, data)
}
