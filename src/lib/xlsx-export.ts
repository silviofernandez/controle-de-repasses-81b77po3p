const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function strBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function createZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const nb = strBytes(f.name)
    const crc = crc32(f.data)
    const sz = f.data.length
    const lh = new DataView(new ArrayBuffer(30))
    lh.setUint32(0, 0x04034b50, true)
    lh.setUint16(4, 20, true)
    lh.setUint16(8, 0, true)
    lh.setUint16(12, 0x21, true)
    lh.setUint32(14, crc, true)
    lh.setUint32(18, sz, true)
    lh.setUint32(22, sz, true)
    lh.setUint16(26, nb.length, true)
    parts.push(new Uint8Array(lh.buffer), nb, f.data)
    const ch = new DataView(new ArrayBuffer(46))
    ch.setUint32(0, 0x02014b50, true)
    ch.setUint16(4, 20, true)
    ch.setUint16(6, 20, true)
    ch.setUint16(12, 0x21, true)
    ch.setUint32(16, crc, true)
    ch.setUint32(20, sz, true)
    ch.setUint32(24, sz, true)
    ch.setUint16(28, nb.length, true)
    ch.setUint32(42, offset, true)
    central.push(new Uint8Array(ch.buffer), nb)
    offset += 30 + nb.length + sz
  }
  let cs = 0
  for (const c of central) cs += c.length
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(8, files.length, true)
  eocd.setUint16(10, files.length, true)
  eocd.setUint32(12, cs, true)
  eocd.setUint32(16, offset, true)
  const total = offset + cs + 22
  const res = new Uint8Array(total)
  let pos = 0
  for (const p of parts) {
    res.set(p, pos)
    pos += p.length
  }
  for (const c of central) {
    res.set(c, pos)
    pos += c.length
  }
  res.set(new Uint8Array(eocd.buffer), pos)
  return res
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function colName(n: number): string {
  let r = ''
  while (n >= 0) {
    r = String.fromCharCode(65 + (n % 26)) + r
    n = Math.floor(n / 26) - 1
  }
  return r
}

export function exportToXlsx(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  opts?: { sheetName?: string },
): void {
  const sheetName = opts?.sheetName || 'Relatorio'
  const widths = headers.map((h, i) => {
    let mx = h.length
    for (const r of rows) {
      const l = String(r[i] ?? '').length
      if (l > mx) mx = l
    }
    return Math.min(Math.max(mx + 2, 10), 50)
  })
  const cols = widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('')
  const hdr = headers
    .map((h, i) => `<c r="${colName(i)}1" t="inlineStr" s="1"><is><t>${esc(h)}</t></is></c>`)
    .join('')
  const body = rows
    .map((row, ri) => {
      const cells = row
        .map((c, ci) => {
          const ref = `${colName(ci)}${ri + 2}`
          if (typeof c === 'number') return `<c r="${ref}" s="2"><v>${c}</v></c>`
          return `<c r="${ref}" t="inlineStr" s="2"><is><t>${esc(String(c ?? ''))}</t></is></c>`
        })
        .join('')
      return `<row r="${ri + 2}">${cells}</row>`
    })
    .join('')
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData><row r="1">${hdr}</row>${body}</sheetData></worksheet>`
  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF4472C4"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  const ctXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  const zip = createZip([
    { name: '[Content_Types].xml', data: strBytes(ctXml) },
    { name: '_rels/.rels', data: strBytes(relsXml) },
    { name: 'xl/workbook.xml', data: strBytes(wbXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: strBytes(wbRelsXml) },
    { name: 'xl/worksheets/sheet1.xml', data: strBytes(sheetXml) },
    { name: 'xl/styles.xml', data: strBytes(stylesXml) },
  ])
  const blob = new Blob([zip], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
