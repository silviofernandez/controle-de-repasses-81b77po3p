import type { AnnualReport } from '@/services/annual-report'

interface PdfColumn {
  header: string
  key: string
}

interface PdfTable {
  title?: string
  columns: PdfColumn[]
  rows: Record<string, string | number>[]
}

interface PdfSummaryItem {
  label: string
  value: string
}

interface ComprovanteData {
  contractNumber: string
  ownerName: string
  insurerName: string
  investorName: string
  initialDate: string
  dueDate: string
  repassDate: string
  status: string
  rentAmount: number
  repassValue: number
  receivedAmount: number
}

export function printComprovante(data: ComprovanteData) {
  const win = window.open('', '_blank', 'width=600,height=800')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const fmtDate = (d: string) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-')
  const now = new Date().toLocaleDateString('pt-BR')
  const investorShare = data.repassValue * 0.05
  const agencyShare = data.repassValue * 0.15
  const totalExtra = data.repassValue * 0.2

  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Comprovante de Repasse - ${data.contractNumber}</title>
<style>* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',Arial,sans-serif; padding:40px; color:#1a1a1a; }
.header { text-align:center; margin-bottom:32px; } .header h1 { font-size:24px; margin-bottom:4px; }
.header p { font-size:12px; color:#888; }
.comprovante { border:2px solid #e0e0e0; border-radius:12px; padding:32px; }
.comprovante-title { font-size:18px; font-weight:bold; margin-bottom:24px; text-align:center; }
.info-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f0f0f0; }
.info-label { font-size:14px; color:#666; } .info-value { font-size:14px; font-weight:600; }
.highlight { background:#f0fdf4; border-radius:8px; padding:16px; margin:16px 0; border:1px solid #bbf7d0; }
.highlight .info-value { font-size:20px; color:#16a34a; }
.breakdown { margin-top:20px; padding-top:16px; border-top:2px solid #e0e0e0; }
.breakdown-title { font-size:14px; font-weight:bold; margin-bottom:12px; }
.breakdown-row { display:flex; justify-content:space-between; padding:8px 0; font-size:13px; }
.breakdown-row .label { color:#666; } .breakdown-row .val { font-weight:600; }
.breakdown-total { border-top:1px solid #ddd; margin-top:4px; padding-top:8px; font-weight:bold; }
.footer { margin-top:32px; text-align:center; font-size:11px; color:#aaa; }
@media print { body { padding:20px; } }</style></head><body>
<div class="header"><h1>Controle de Repasses</h1><p>Comprovante gerado em ${now}</p></div>
<div class="comprovante"><div class="comprovante-title">Comprovante de Repasse</div>
<div class="info-row"><span class="info-label">Código do Imóvel (Contrato)</span><span class="info-value">${data.contractNumber}</span></div>
<div class="info-row"><span class="info-label">Proprietário</span><span class="info-value">${data.ownerName || '-'}</span></div>
<div class="info-row"><span class="info-label">Seguradora</span><span class="info-value">${data.insurerName || '-'}</span></div>
<div class="info-row"><span class="info-label">Investidor</span><span class="info-value">${data.investorName || '-'}</span></div>
<div class="info-row"><span class="info-label">Data Inicial</span><span class="info-value">${fmtDate(data.initialDate)}</span></div>
<div class="info-row"><span class="info-label">Data de Vencimento</span><span class="info-value">${fmtDate(data.dueDate)}</span></div>
<div class="info-row"><span class="info-label">Data do Repasse ao Proprietário</span><span class="info-value">${fmtDate(data.repassDate)}</span></div>
<div class="info-row"><span class="info-label">Status</span><span class="info-value">${data.status}</span></div>
<div class="info-row"><span class="info-label">Valor do Aluguel</span><span class="info-value">${fmt(data.rentAmount)}</span></div>
<div class="highlight"><div class="info-row" style="border:none;"><span class="info-label">Valor do Repasse</span><span class="info-value">${fmt(data.repassValue)}</span></div></div>
<div class="info-row"><span class="info-label">Valor Recebido da Seguradora</span><span class="info-value">${fmt(data.receivedAmount)}</span></div>
<div class="breakdown"><div class="breakdown-title">Composição do Repasse ao Investidor (20% extra)</div>
<div class="breakdown-row"><span class="label">Valor do Repasse (base)</span><span class="val">${fmt(data.repassValue)}</span></div>
<div class="breakdown-row"><span class="label">Extra total (20%)</span><span class="val">${fmt(totalExtra)}</span></div>
<div class="breakdown-row"><span class="label">Repasse ao Investidor (5%)</span><span class="val">${fmt(investorShare)}</span></div>
<div class="breakdown-row"><span class="label">Taxa da Imobiliária (15%)</span><span class="val">${fmt(agencyShare)}</span></div>
<div class="breakdown-row breakdown-total"><span>Total a repassar ao investidor</span><span>${fmt(data.repassValue + investorShare)}</span></div>
</div></div>
<div class="footer">Controle de Repasses — Comprovante gerado automaticamente</div>
<script>window.onload=function(){window.print();}</script></body></html>`)
  win.document.close()
}

export function printDocument(title: string, tables: PdfTable[], summary?: PdfSummaryItem[]) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }

  const tableHTML = tables
    .map((table) => {
      const headerCells = table.columns.map((c) => `<th>${c.header}</th>`).join('')
      const bodyRows = table.rows
        .map((row) => {
          const cells = table.columns.map((c) => `<td>${row[c.key] ?? '-'}</td>`).join('')
          return `<tr>${cells}</tr>`
        })
        .join('')
      return `${table.title ? `<h2>${table.title}</h2>` : ''}<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows || '<tr><td colspan="' + table.columns.length + '" style="text-align:center;color:#999">Nenhum dado</td></tr>'}</tbody></table>`
    })
    .join('')

  const summaryHTML = summary
    ? `<div class="summary">${summary.map((s) => `<div class="summary-item"><span class="summary-label">${s.label}</span><span class="summary-value">${s.value}</span></div>`).join('')}</div>`
    : ''
  const now = new Date().toLocaleDateString('pt-BR')

  win.document
    .write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title>
<style>* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',Arial,sans-serif; padding:32px; color:#1a1a1a; }
h1 { font-size:22px; margin-bottom:4px; } .date { font-size:12px; color:#888; margin-bottom:24px; }
.summary { display:flex; flex-wrap:wrap; gap:16px; margin-bottom:24px; }
.summary-item { background:#f5f5f5; border-radius:8px; padding:12px 16px; min-width:160px; }
.summary-label { display:block; font-size:11px; color:#888; margin-bottom:4px; }
.summary-value { display:block; font-size:18px; font-weight:bold; }
h2 { font-size:16px; margin:24px 0 8px; }
table { width:100%; border-collapse:collapse; margin-bottom:16px; font-size:12px; }
th { background:#f0f0f0; text-align:left; padding:8px 10px; border-bottom:2px solid #ddd; font-weight:600; }
td { padding:8px 10px; border-bottom:1px solid #eee; } tr:nth-child(even) td { background:#fafafa; }
.footer { margin-top:32px; font-size:11px; color:#aaa; text-align:center; }
@media print { body { padding:16px; } .no-print { display:none; } }</style></head><body>
<h1>${title}</h1><p class="date">Gerado em ${now}</p>${summaryHTML}${tableHTML}
<div class="footer">Controle de Repasses — Documento gerado automaticamente</div>
<script>window.onload=function(){window.print();}</script></body></html>`)
  win.document.close()
}

export function printAnnualReport(report: AnnualReport) {
  const win = window.open('', '_blank', 'width=1000,height=800')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const now = new Date().toLocaleDateString('pt-BR')

  const summaryHeader = [
    'Investidor',
    'Total Repasse',
    'Total Recebido',
    'Lucro (20%)',
    'Investidor (5%)',
    'Imobiliária (15%)',
    'Pastas',
  ]
  const summaryRows = report.investors.map((inv) => [
    inv.investor_name,
    fmt(inv.total_repasse),
    fmt(inv.total_received),
    fmt(inv.profit),
    fmt(inv.investor_share),
    fmt(inv.company_share),
    String(inv.folder_count),
  ])
  summaryRows.push([
    'TOTAL',
    fmt(report.totals.total_repasse),
    fmt(report.totals.total_received),
    fmt(report.totals.profit),
    fmt(report.totals.investor_share),
    fmt(report.totals.company_share),
    String(report.totals.folder_count),
  ])

  const summaryTable = `<table><thead><tr>${summaryHeader.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${summaryRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`

  const monthlyHeader = [
    'Mês',
    'Total Repasse',
    'Total Recebido',
    'Lucro (20%)',
    'Investidor (5%)',
    'Imobiliária (15%)',
  ]

  const monthlySection = report.investors
    .map((inv) => {
      const rows = inv.monthly.map((m) => [
        m.month_label,
        fmt(m.total_repasse),
        fmt(m.total_received),
        fmt(m.profit),
        fmt(m.investor_share),
        fmt(m.company_share),
      ])
      rows.push([
        'Total',
        fmt(inv.total_repasse),
        fmt(inv.total_received),
        fmt(inv.profit),
        fmt(inv.investor_share),
        fmt(inv.company_share),
      ])
      return `<h2>${inv.investor_name}</h2><table><thead><tr>${monthlyHeader.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    })
    .join('')

  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Relatório Anual ${report.year}</title>
<style>* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',Arial,sans-serif; padding:32px; color:#1a1a1a; }
h1 { font-size:22px; margin-bottom:4px; }
.date { font-size:12px; color:#888; margin-bottom:24px; }
h2 { font-size:16px; margin:24px 0 8px; }
table { width:100%; border-collapse:collapse; margin-bottom:16px; font-size:11px; }
th { background:#f0f0f0; text-align:left; padding:8px 10px; border-bottom:2px solid #ddd; font-weight:600; }
td { padding:8px 10px; border-bottom:1px solid #eee; }
tr:nth-child(even) td { background:#fafafa; }
.footer { margin-top:32px; font-size:11px; color:#aaa; text-align:center; }
@media print { body { padding:16px; } }</style></head><body>
<h1>Relatório Anual Consolidado — ${report.year}</h1>
<p class="date">Gerado em ${now}</p>
<h2>Resumo Anual por Investidor</h2>
${summaryTable}
<h2>Comparativo Mensal por Investidor</h2>
${monthlySection}
<div class="footer">Controle de Repasses — Documento gerado automaticamente</div>
<script>window.onload=function(){window.print();}</script></body></html>`)
  win.document.close()
}
