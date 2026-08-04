import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface SettingRecord extends RecordModel {
  key: string
  value: string
  description: string
}

export const getSettings = async (): Promise<SettingRecord[]> => {
  return await pb.collection('settings').getFullList<SettingRecord>()
}

export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const record = await pb.collection('settings').getFirstListItem<SettingRecord>(`key = "${key}"`)
    return record.value
  } catch {
    return null
  }
}

export const updateSetting = async (id: string, data: Partial<SettingRecord>) => {
  return await pb.collection('settings').update<SettingRecord>(id, data)
}

export const createSetting = async (data: Partial<SettingRecord>) => {
  return await pb.collection('settings').create<SettingRecord>(data)
}
