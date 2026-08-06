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
