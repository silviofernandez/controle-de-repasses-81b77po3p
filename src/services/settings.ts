import pb from '@/lib/pocketbase/client'

export interface Setting {
  id: string
  key: string
  value: string
  description: string
}

export const getSettings = () =>
  pb.collection('settings').getFullList({ sort: 'key' }) as Promise<Setting[]>

export const getSetting = (key: string) =>
  pb.collection('settings').getFirstListItem(`key = "${key}"`) as Promise<Setting>

export const createSetting = (data: { key: string; value: string; description?: string }) =>
  pb.collection('settings').create(data)

export const updateSetting = (id: string, data: Partial<{ value: string; description: string }>) =>
  pb.collection('settings').update(id, data)

export const deleteSetting = (id: string) => pb.collection('settings').delete(id)
