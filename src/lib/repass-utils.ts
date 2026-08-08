import type { FolderRecord } from '@/services/folders'

export function computeRepassValue(
  folder: Pick<FolderRecord, 'rent_amount' | 'manual_repass_value'>,
): number {
  if (folder.manual_repass_value && folder.manual_repass_value > 0) {
    return folder.manual_repass_value
  }
  return folder.rent_amount || 0
}

export function computeDefaultReceivedValue(
  folder: Pick<FolderRecord, 'rent_amount' | 'manual_repass_value'>,
): number {
  return computeRepassValue(folder) * 1.2
}
