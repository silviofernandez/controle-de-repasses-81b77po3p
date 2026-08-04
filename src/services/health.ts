import pb from '@/lib/pocketbase/client'

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const res = await pb.health.check()
    return res.code === 200
  } catch {
    try {
      await pb.send('/api/health', { method: 'GET' })
      return true
    } catch {
      return false
    }
  }
}
