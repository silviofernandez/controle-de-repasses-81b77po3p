import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface FolderHistoryRecord extends RecordModel {
  folder_id: string
  field_name: string
  old_value: string
  new_value: string
  changed_by: string
  expand?: {
    changed_by?: { id: string; name: string; email: string }
  }
}

export const getFolderHistory = async (folderId: string): Promise<FolderHistoryRecord[]> => {
  return await pb.collection('folder_history').getFullList<FolderHistoryRecord>({
    filter: `folder_id = "${folderId}"`,
    sort: '-created',
    expand: 'changed_by',
  })
}
