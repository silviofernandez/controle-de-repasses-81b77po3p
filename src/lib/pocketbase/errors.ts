import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    const data = error.response?.data || {}

    // Check for unique constraint errors across all fields
    const hasUniqueError = Object.values(data).some(
      (detail: any) =>
        detail?.code === 'validation_not_unique' ||
        (typeof detail?.message === 'string' &&
          (detail.message.toLowerCase().includes('unique') ||
            detail.message.toLowerCase().includes('already exists'))),
    )

    if (hasUniqueError || error.message?.toLowerCase().includes('unique')) {
      return 'Este e-mail ou documento já está cadastrado.'
    }

    const fieldErrors = extractFieldErrors(error)
    const msgs = Object.values(fieldErrors)
    if (msgs.length > 0) {
      return msgs.join(' ')
    }

    if (error.message === 'Failed to create record.') {
      return 'Não foi possível criar o registro. Verifique os dados fornecidos.'
    }

    return error.message || 'Falha na comunicação com o servidor.'
  }

  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
}
