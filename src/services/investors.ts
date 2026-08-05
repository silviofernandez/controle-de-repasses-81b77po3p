import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export interface InvestorRecord extends RecordModel {
  user_id: string
  name: string
  email: string
  phone: string
  document: string
}

export const getInvestors = async (): Promise<InvestorRecord[]> => {
  return await pb.collection('investors').getFullList<InvestorRecord>({
    sort: 'name',
  })
}

export const getInvestor = async (id: string): Promise<InvestorRecord> => {
  return await pb.collection('investors').getOne<InvestorRecord>(id)
}

export const createInvestor = async (data: Partial<InvestorRecord>): Promise<InvestorRecord> => {
  const nameTrimmed = data.name?.trim() || ''
  const emailTrimmed = data.email?.trim() || ''
  const phoneTrimmed = data.phone?.trim() || ''
  const documentTrimmed = data.document?.trim() || ''
  let userId = data.user_id

  if (!nameTrimmed) {
    throw new Error('O nome é obrigatório.')
  }

  // Check if investor with same email already exists
  if (emailTrimmed) {
    try {
      const existing = await pb
        .collection('investors')
        .getFirstListItem(`email = "${emailTrimmed}"`)
      if (existing) {
        throw new Error('Este e-mail ou documento já está cadastrado.')
      }
    } catch (err: any) {
      if (err?.message === 'Este e-mail ou documento já está cadastrado.') {
        throw err
      }
    }
  }

  // Check if investor with same document already exists
  if (documentTrimmed) {
    try {
      const existing = await pb
        .collection('investors')
        .getFirstListItem(`document = "${documentTrimmed}"`)
      if (existing) {
        throw new Error('Este e-mail ou documento já está cadastrado.')
      }
    } catch (err: any) {
      if (err?.message === 'Este e-mail ou documento já está cadastrado.') {
        throw err
      }
    }
  }

  // User relation handling: if user_id is not provided, look up or create auth user
  if (!userId && emailTrimmed) {
    try {
      const user = await pb.collection('users').getFirstListItem(`email = "${emailTrimmed}"`)
      userId = user.id
    } catch {
      try {
        const newUser = await pb.collection('users').create({
          email: emailTrimmed,
          name: nameTrimmed,
          role: 'investidor',
          password: 'Skip@Pass',
          passwordConfirm: 'Skip@Pass',
        })
        userId = newUser.id
      } catch (userErr: any) {
        const msg = getErrorMessage(userErr)
        if (msg.includes('cadastrado') || msg.toLowerCase().includes('unique')) {
          throw new Error('Este e-mail ou documento já está cadastrado.')
        }
      }
    }
  }

  const payload: Record<string, any> = {
    name: nameTrimmed,
  }
  if (emailTrimmed) payload.email = emailTrimmed
  if (phoneTrimmed) payload.phone = phoneTrimmed
  if (documentTrimmed) payload.document = documentTrimmed
  if (userId) payload.user_id = userId

  try {
    return await pb.collection('investors').create<InvestorRecord>(payload)
  } catch (err: any) {
    const msg = getErrorMessage(err)
    if (msg.includes('cadastrado') || msg.toLowerCase().includes('unique')) {
      throw new Error('Este e-mail ou documento já está cadastrado.')
    }
    throw new Error(msg)
  }
}

export const updateInvestor = async (
  id: string,
  data: Partial<InvestorRecord>,
): Promise<InvestorRecord> => {
  try {
    return await pb.collection('investors').update<InvestorRecord>(id, data)
  } catch (err: any) {
    throw new Error(getErrorMessage(err))
  }
}

export const deleteInvestor = async (id: string): Promise<void> => {
  try {
    await pb.collection('investors').delete(id)
  } catch (err: any) {
    throw new Error(getErrorMessage(err))
  }
}
