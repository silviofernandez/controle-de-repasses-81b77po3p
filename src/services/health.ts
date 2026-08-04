import pb from '@/lib/pocketbase/client'

export const checkHealth = async (): Promise<boolean> => {
  try {
    await pb.health.getHealth({ requestKey: null })
    return true
  } catch {
    return false
  }
}
