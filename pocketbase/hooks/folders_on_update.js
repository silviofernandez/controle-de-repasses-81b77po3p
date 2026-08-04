onRecordUpdate((e) => {
  const record = e.record

  function fmtDate(d) {
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0') +
      ' 00:00:00.000Z'
    )
  }
  function addBusinessDays(dateStr, n) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    let count = 0
    while (count < n) {
      d.setDate(d.getDate() + 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) count++
    }
    return fmtDate(d)
  }
  function addDays(dateStr, n) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    d.setDate(d.getDate() + n)
    return fmtDate(d)
  }

  let surchargePct = 5
  let investorSharePct = 5
  let companySharePct = 15
  try {
    const s = $app.findFirstRecordByData('settings', 'key', 'default_surcharge_pct')
    if (s) surchargePct = parseFloat(s.getString('value')) || 5
  } catch (_) {}
  try {
    const s = $app.findFirstRecordByData('settings', 'key', 'investor_share_pct')
    if (s) investorSharePct = parseFloat(s.getString('value')) || 5
  } catch (_) {}
  try {
    const s = $app.findFirstRecordByData('settings', 'key', 'company_share_pct')
    if (s) companySharePct = parseFloat(s.getString('value')) || 15
  } catch (_) {}

  const initialDateChanged =
    record.getString('initial_date') !== record.original().getString('initial_date')
  const initialDate = record.getString('initial_date')
  if (initialDate && (initialDateChanged || !record.getString('owner_transfer_date'))) {
    const ownerTransferDate = addBusinessDays(initialDate, 5)
    record.set('owner_transfer_date', ownerTransferDate)
    const insurerSubmissionDate = addDays(ownerTransferDate, 16)
    record.set('insurer_submission_date', insurerSubmissionDate)
    const estimatedReceiptDate = addDays(insurerSubmissionDate, 45)
    record.set('estimated_receipt_date', estimatedReceiptDate)
  }

  if (!record.get('surcharge_percent')) record.set('surcharge_percent', surchargePct)
  if (!record.get('investor_percent')) record.set('investor_percent', companySharePct)

  const rentAmount = record.get('rent_amount') || 0
  const receivedAmount = record.get('received_amount') || 0

  if (receivedAmount > 0) {
    record.set('surcharge_amount', receivedAmount - rentAmount)
    record.set('investor_share_amount', rentAmount * (investorSharePct / 100))
    record.set('company_share_amount', rentAmount * (companySharePct / 100))
    if (!record.getString('actual_receipt_date')) {
      record.set('actual_receipt_date', fmtDate(new Date()))
    }
  } else {
    const surchargeAmount = rentAmount * (surchargePct / 100)
    const companyShareAmount = rentAmount * (companySharePct / 100)
    record.set('surcharge_amount', surchargeAmount)
    record.set('company_share_amount', companyShareAmount)
    record.set('investor_share_amount', rentAmount - surchargeAmount - companyShareAmount)
  }

  const investorId = record.getString('investor_id')
  if (investorId) {
    try {
      const investor = $app.findRecordById('investors', investorId)
      const userId = investor.getString('user_id')
      if (userId) record.set('user_id', userId)
    } catch (_) {}
  }

  if (record.getString('status') === 'repassado' && !record.getString('repassed_date')) {
    record.set('repassed_date', fmtDate(new Date()))
  }

  const now = new Date()
  const repassedDate = record.getString('repassed_date')
  const actualReceiptDate = record.getString('actual_receipt_date')
  const estimatedReceiptDate = record.getString('estimated_receipt_date')
  const insurerSubmissionDate = record.getString('insurer_submission_date')
  const ownerTransferDate = record.getString('owner_transfer_date')

  let status = 'pendente'
  if (repassedDate) {
    status = 'repassado'
  } else if (actualReceiptDate || receivedAmount > 0) {
    status = 'recebido'
  } else if (estimatedReceiptDate && new Date(estimatedReceiptDate) <= now) {
    status = 'recebido'
  } else if (insurerSubmissionDate && new Date(insurerSubmissionDate) <= now) {
    status = 'subido'
  } else if (ownerTransferDate && new Date(ownerTransferDate) <= now) {
    status = 'transferido'
  }
  record.set('status', status)

  e.next()
}, 'folders')
