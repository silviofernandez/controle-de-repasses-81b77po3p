import pb from '@/lib/pocketbase/client'

export const getProfiles = () => pb.collection('profiles').getFullList({ sort: '-created' })
export const getProfile = (id: string) => pb.collection('profiles').getOne(id)
export const getProfileByUserId = (userId: string) =>
  pb.collection('profiles').getFirstListItem(`user_id = "${userId}"`)
export const createProfile = (data: {
  user_id: string
  role: string
  name: string
  phone?: string
}) => pb.collection('profiles').create(data)
export const updateProfile = (
  id: string,
  data: Partial<{ role: string; name: string; phone: string }>,
) => pb.collection('profiles').update(id, data)
export const deleteProfile = (id: string) => pb.collection('profiles').delete(id)
