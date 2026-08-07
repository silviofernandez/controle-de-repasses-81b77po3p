import type { FolderRecord } from '@/services/folders'

export function computeRepassValue(
  folder: Pick<FolderRecord, 'rent_amount' | 'punctuality_discount' | 'manual_repass_value'>,
): number {
  const rent = folder.rent_amount || 0
  const discount = folder.punctuality_discount || 0
  const adminFee = rent * 0.1
  const calculated = rent - discount - adminFee

  if (folder.manual_repass_value && folder.manual_repass_value > 0) {
    return folder.manual_repass_value
  }
  return calculated
}

export function computeDefaultReceivedValue(
  folder: Pick<FolderRecord, 'rent_amount' | 'punctuality_discount' | 'manual_repass_value'>,
): number {
  return computeRepassValue(folder) * 1.2
}
