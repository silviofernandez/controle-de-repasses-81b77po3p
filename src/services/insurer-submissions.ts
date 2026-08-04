import pb from '@/lib/pocketbase/client'
import type { FolderRecord } from '@/services/folders'

export function getTodayStr(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayFormatted(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function generateWhatsAppText(folders: FolderRecord[]): string {
  return folders
    .map(
      (f) =>
        `${f.contract_number} - ${f.owner_name || 'N/A'} - ${f.expand?.insurer_id?.name || 'N/A'}`,
    )
    .join('\n')
}

export function generatePrintHtml(folders: FolderRecord[]): string {
  const dateStr = getTodayFormatted()
  const rows = folders
    .map(
      (f) =>
        `<tr><td>${f.contract_number}</td><td>${f.owner_name || '-'}</td><td>${f.expand?.insurer_id?.name || '-'}</td></tr>`,
    )
    .join('')
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de Envio à Seguradora</title>
<style>
body{font-family:Arial,sans-serif;margin:40px;color:#333}
h1{font-size:24px;margin-bottom:8px}
.date{font-size:14px;color:#666;margin-bottom:24px}
table{width:100%;border-collapse:collapse}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #ddd}
th{background:#f5f5f5;font-weight:600;font-size:13px;text-transform:uppercase}
td{font-size:14px}
@media print{body{margin:20px}}
</style>
</head><body>
<h1>Relatório de Envio à Seguradora</h1>
<p class="date">Data: ${dateStr}</p>
<table><thead><tr><th>Nº da Pasta</th><th>Proprietário</th><th>Seguradora</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`
}

export const getTodaysInsurerSubmissions = async (): Promise<FolderRecord[]> => {
  const todayStr = getTodayStr()
  return await pb.collection('folders').getFullList<FolderRecord>({
    filter: `insurer_submission_date = "${todayStr}"`,
    sort: 'contract_number',
    expand: 'investor_id,insurer_id',
  })
}

export const sendInsurerSubmissionEmail = async (locale = 'pt-BR') => {
  return await pb.send('/backend/v1/insurer-submissions/send-email', {
    method: 'POST',
    body: JSON.stringify({ locale, date: getTodayStr() }),
    headers: { 'Content-Type': 'application/json' },
  })
}
