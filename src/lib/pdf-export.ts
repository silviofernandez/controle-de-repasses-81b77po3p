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
  repassValue: number
  repassDate: string
  status: string
  punctualityDiscount: number
  adminFee: number
  rentAmount: number
}

export function printComprovante(data: ComprovanteData) {
  const win = window.open('', '_blank', 'width=600,height=800')
  if (!win) {
    alert('Por favor, permita popups para exportar o PDF.')
    return
  }

  const formattedDate = new Date().toLocaleDateString('pt-BR')
  const formattedRepassDate = data.repassDate
    ? new Date(data.repassDate + 'T00:00:00').toLocaleDateString('pt-BR')
    : '-'

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Comprovante de Repasse - ${data.contractNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { font-size: 24px; margin-bottom: 4px; }
        .header p { font-size: 12px; color: #888; }
        .comprovante { border: 2px solid #e0e0e0; border-radius: 12px; padding: 32px; }
        .comprovante-title { font-size: 18px; font-weight: bold; margin-bottom: 24px; text-align: center; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { font-size: 14px; color: #666; }
        .info-value { font-size: 14px; font-weight: 600; }
        .highlight { background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #bbf7d0; }
        .highlight .info-value { font-size: 22px; color: #16a34a; }
        .calc-section { margin-top: 24px; padding-top: 16px; border-top: 2px solid #e0e0e0; }
        .calc-section .info-label { font-size: 12px; }
        .calc-section .info-value { font-size: 14px; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Controle de Repasses</h1>
        <p>Comprovante gerado em ${formattedDate}</p>
      </div>
      <div class="comprovante">
        <div class="comprovante-title">Comprovante de Repasse</div>
        <div class="info-row">
          <span class="info-label">Código do Imóvel (Contrato)</span>
          <span class="info-value">${data.contractNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Proprietário</span>
          <span class="info-value">${data.ownerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data do Repasse</span>
          <span class="info-value">${formattedRepassDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">${data.status}</span>
        </div>
        <div class="highlight">
          <div class="info-row" style="border: none;">
            <span class="info-label">Valor do Repasse</span>
            <span class="info-value">${fmt(data.repassValue)}</span>
          </div>
        </div>
        <div class="calc-section">
          <div class="info-row">
            <span class="info-label">Valor do Aluguel</span>
            <span class="info-value">${fmt(data.rentAmount)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Desconto de Pontualidade</span>
            <span class="info-value">- ${fmt(data.punctualityDiscount)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Taxa de Administração (10%)</span>
            <span class="info-value">- ${fmt(data.adminFee)}</span>
          </div>
        </div>
      </div>
      <div class="footer">Controle de Repasses — Comprovante gerado automaticamente</div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `)
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
      return `
        ${table.title ? `<h2>${table.title}</h2>` : ''}
        <table>
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${bodyRows || '<tr><td colspan="' + table.columns.length + '" style="text-align:center;color:#999">Nenhum dado</td></tr>'}</tbody>
        </table>
      `
    })
    .join('')

  const summaryHTML = summary
    ? `<div class="summary">
        ${summary.map((s) => `<div class="summary-item"><span class="summary-label">${s.label}</span><span class="summary-value">${s.value}</span></div>`).join('')}
      </div>`
    : ''

  const now = new Date().toLocaleDateString('pt-BR')

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1a1a; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .date { font-size: 12px; color: #888; margin-bottom: 24px; }
        .summary { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
        .summary-item { background: #f5f5f5; border-radius: 8px; padding: 12px 16px; min-width: 160px; }
        .summary-label { display: block; font-size: 11px; color: #888; margin-bottom: 4px; }
        .summary-value { display: block; font-size: 18px; font-weight: bold; }
        h2 { font-size: 16px; margin: 24px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
        th { background: #f0f0f0; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd; font-weight: 600; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #fafafa; }
        .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; }
        @media print {
          body { padding: 16px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="date">Gerado em ${now}</p>
      ${summaryHTML}
      ${tableHTML}
      <div class="footer">Controle de Repasses — Documento gerado automaticamente</div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `)
  win.document.close()
}
