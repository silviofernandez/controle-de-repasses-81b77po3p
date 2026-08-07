export const FOLDER_STATUSES = [
  'à repassar',
  'garantido',
  'recebido',
  'em análise',
  'pgto agendado',
] as const

export const statusLabels: Record<string, string> = {
  'à repassar': 'À Repassar',
  garantido: 'Garantido',
  recebido: 'Recebido',
  'em análise': 'Em Análise',
  'pgto agendado': 'Pgto Agendado',
}

export const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  'à repassar': 'secondary',
  garantido: 'default',
  recebido: 'default',
  'em análise': 'secondary',
  'pgto agendado': 'secondary',
}

export const statusColors: Record<string, string> = {
  'à repassar': 'text-orange-600',
  garantido: 'text-blue-600',
  recebido: 'text-green-600',
  'em análise': 'text-purple-600',
  'pgto agendado': 'text-cyan-600',
}
