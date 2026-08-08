onRecordCreate((e) => {
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

  var ownerTransferDate = record.getString('owner_transfer_date')

  if (ownerTransferDate) {
    var insurerSubmissionDate = addDays(ownerTransferDate, 16)
    record.set('insurer_submission_date', insurerSubmissionDate)
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

  e.next()
}, 'folders')
