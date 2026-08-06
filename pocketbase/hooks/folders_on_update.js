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
  function addDays(dateStr, n) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    d.setDate(d.getDate() + n)
    return fmtDate(d)
  }

  var ownerTransferDateChanged =
    record.getString('owner_transfer_date') !== record.original().getString('owner_transfer_date')
  var ownerTransferDate = record.getString('owner_transfer_date')

  if (
    ownerTransferDate &&
    (ownerTransferDateChanged || !record.getString('insurer_submission_date'))
  ) {
    var insurerSubmissionDate = addDays(ownerTransferDate, 16)
    record.set('insurer_submission_date', insurerSubmissionDate)
    var estimatedReceiptDate = addDays(insurerSubmissionDate, 45)
    record.set('estimated_receipt_date', estimatedReceiptDate)
  }

  if (!record.getString('initial_date') && ownerTransferDate) {
    record.set('initial_date', ownerTransferDate)
  }

  var investorId = record.getString('investor_id')
  if (investorId) {
    try {
      var investor = $app.findRecordById('investors', investorId)
      var userId = investor.getString('user_id')
      if (userId) record.set('user_id', userId)
    } catch (_) {}
  }

  if (record.getString('status') === 'repassado' && !record.getString('repassed_date')) {
    record.set('repassed_date', fmtDate(new Date()))
  }

  e.next()
}, 'folders')
