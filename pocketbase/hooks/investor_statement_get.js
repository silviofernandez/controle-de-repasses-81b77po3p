routerAdd(
  'GET',
  '/backend/v1/investors/statement',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação requerida')

    let investorId = ''
    try {
      const investor = $app.findFirstRecordByFilter('investors', "user_id = '" + auth.id + "'")
      investorId = investor.id
    } catch (err) {
      return e.json(200, {
        total_guaranteed: 0,
        total_open: 0,
        received_this_month: 0,
        total_to_receive: 0,
        average_ratio: 0,
        folders: [],
      })
    }

    let folders = []
    try {
      folders = $app.findRecordsByFilter(
        'folders',
        "investor_id = '" + investorId + "'",
        '-owner_transfer_date',
        0,
        0,
      )
    } catch (err) {
      return e.json(200, {
        total_guaranteed: 0,
        total_open: 0,
        received_this_month: 0,
        total_to_receive: 0,
        average_ratio: 0,
        folders: [],
      })
    }

    var emptyResponse = {
      total_guaranteed: 0,
      total_open: 0,
      received_this_month: 0,
      total_to_receive: 0,
      average_ratio: 0,
      folders: [],
    }

    var totalGuaranteed = 0
    var totalOpen = 0
    var receivedThisMonth = 0
    var totalReceived = 0
    var folderDetails = []

    var now = new Date()
    var currentYear = now.getUTCFullYear()
    var currentMonth = now.getUTCMonth() + 1

    for (var i = 0; i < folders.length; i++) {
      var folder = folders[i]
      var investorShare = folder.get('investor_share_amount') || 0
      var receivedAmount = folder.get('received_amount') || 0
      var status = folder.getString('status') || 'pendente'
      var ownerTransferDate = folder.getString('owner_transfer_date') || ''
      var actualReceiptDate = folder.getString('actual_receipt_date') || ''
      var repassedDate = folder.getString('repassed_date') || ''

      totalGuaranteed += investorShare

      if (status !== 'recebido') {
        totalOpen += investorShare
      } else {
        totalReceived += investorShare

        if (repassedDate) {
          try {
            var d = new Date(repassedDate)
            if (d.getUTCFullYear() === currentYear && d.getUTCMonth() + 1 === currentMonth) {
              receivedThisMonth += investorShare
            }
          } catch (_) {}
        }
      }

      var insurerName = ''
      var insurerId = folder.getString('insurer_id')
      if (insurerId) {
        try {
          var insurer = $app.findRecordById('insurers', insurerId)
          insurerName = insurer.getString('name')
        } catch (_) {}
      }

      var daysOpen = 0
      var daysToReturn = 0
      if (ownerTransferDate) {
        var startDate = new Date(ownerTransferDate + 'T00:00:00Z')
        if (status === 'recebido' && actualReceiptDate) {
          var endDate = new Date(actualReceiptDate + 'T00:00:00Z')
          daysToReturn = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)
          daysOpen = daysToReturn
        } else {
          var today = new Date()
          daysOpen = Math.floor((today.getTime() - startDate.getTime()) / 86400000)
        }
      }

      var percentageDiff = 0
      if (receivedAmount > 0 && investorShare > 0) {
        percentageDiff = ((receivedAmount - investorShare) / investorShare) * 100
      }

      folderDetails.push({
        id: folder.id,
        contract_number: folder.getString('contract_number'),
        owner_name: folder.getString('owner_name') || '',
        insurer_name: insurerName,
        owner_transfer_date: ownerTransferDate,
        actual_receipt_date: actualReceiptDate,
        investor_share_amount: investorShare,
        received_amount: receivedAmount,
        status: status,
        days_open: daysOpen,
        days_to_return: daysToReturn,
        percentage_diff: percentageDiff,
      })
    }

    var totalToReceive = totalOpen
    var averageRatio = totalGuaranteed > 0 ? (totalReceived / totalGuaranteed) * 100 : 0

    return e.json(200, {
      total_guaranteed: totalGuaranteed,
      total_open: totalOpen,
      received_this_month: receivedThisMonth,
      total_to_receive: totalToReceive,
      average_ratio: averageRatio,
      folders: folderDetails,
    })
  },
  $apis.requireAuth(),
)
