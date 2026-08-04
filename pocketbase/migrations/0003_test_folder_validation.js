migrate(
  (app) => {
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
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      let c = 0
      while (c < n) {
        d.setDate(d.getDate() + 1)
        if (d.getDay() !== 0 && d.getDay() !== 6) c++
      }
      return fmtDate(d)
    }
    function addDays(dateStr, n) {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      d.setDate(d.getDate() + n)
      return fmtDate(d)
    }

    let investor
    try {
      investor = app.findFirstRecordByData('investors', 'name', 'João Silva')
    } catch (_) {
      console.log('TEST SKIPPED: No investor found for test folder')
      return
    }

    const testInitialDate = '2026-08-10'
    const expectedOwnerTransfer = addBusinessDays(testInitialDate, 5)
    const expectedInsurerSubmission = addDays(expectedOwnerTransfer, 16)
    const expectedEstimatedReceipt = addDays(expectedInsurerSubmission, 45)
    const testRent = 3000
    const expectedSurcharge = testRent * 0.05
    const expectedCompanyShare = testRent * 0.15
    const expectedInvestorShare = testRent - expectedSurcharge - expectedCompanyShare

    const foldersCol = app.findCollectionByNameOrId('folders')
    const testRecord = new Record(foldersCol)
    testRecord.set('contract_number', 'TEST-VALIDATION-001')
    testRecord.set('investor_id', investor.id)
    testRecord.set('initial_date', testInitialDate + ' 00:00:00.000Z')
    testRecord.set('rent_amount', testRent)
    testRecord.set('owner_transfer_date', expectedOwnerTransfer)
    testRecord.set('insurer_submission_date', expectedInsurerSubmission)
    testRecord.set('estimated_receipt_date', expectedEstimatedReceipt)
    testRecord.set('surcharge_percent', 5)
    testRecord.set('investor_percent', 15)
    testRecord.set('surcharge_amount', expectedSurcharge)
    testRecord.set('company_share_amount', expectedCompanyShare)
    testRecord.set('investor_share_amount', expectedInvestorShare)
    testRecord.set('status', 'pendente')
    testRecord.set('user_id', investor.getString('user_id'))
    app.save(testRecord)

    const saved = app.findRecordById('folders', testRecord.id)
    let allPassed = true

    const checks = [
      {
        field: 'owner_transfer_date',
        expected: expectedOwnerTransfer,
        actual: saved.getString('owner_transfer_date'),
      },
      {
        field: 'insurer_submission_date',
        expected: expectedInsurerSubmission,
        actual: saved.getString('insurer_submission_date'),
      },
      {
        field: 'estimated_receipt_date',
        expected: expectedEstimatedReceipt,
        actual: saved.getString('estimated_receipt_date'),
      },
      { field: 'surcharge_percent', expected: 5, actual: saved.get('surcharge_percent') },
      { field: 'investor_percent', expected: 15, actual: saved.get('investor_percent') },
      {
        field: 'surcharge_amount',
        expected: expectedSurcharge,
        actual: saved.get('surcharge_amount'),
      },
      {
        field: 'company_share_amount',
        expected: expectedCompanyShare,
        actual: saved.get('company_share_amount'),
      },
      {
        field: 'investor_share_amount',
        expected: expectedInvestorShare,
        actual: saved.get('investor_share_amount'),
      },
      { field: 'status', expected: 'pendente', actual: saved.getString('status') },
    ]

    for (const c of checks) {
      const passed = String(c.actual) === String(c.expected)
      if (!passed) allPassed = false
      console.log(
        'TEST ' +
          (passed ? 'PASS' : 'FAIL') +
          ' - ' +
          c.field +
          ': expected=' +
          c.expected +
          ' actual=' +
          c.actual,
      )
    }

    console.log('TEST RESULT: ' + (allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'))

    app.delete(saved)
    console.log('TEST RECORD DELETED: ' + testRecord.id)
  },
  (app) => {},
)
