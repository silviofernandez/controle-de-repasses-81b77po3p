routerAdd(
  'GET',
  '/backend/v1/investors/upcoming-payments',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação requerida')

    let investorId = ''
    try {
      const investor = $app.findFirstRecordByFilter('investors', "user_id = '" + auth.id + "'")
      investorId = investor.id
    } catch (err) {
      return e.json(200, [])
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setUTCDate(now.getUTCDate() + 1)
    const dayAfter = new Date(now)
    dayAfter.setUTCDate(now.getUTCDate() + 2)

    function toDateString(d) {
      var year = d.getUTCFullYear()
      var month = ('0' + (d.getUTCMonth() + 1)).slice(-2)
      var day = ('0' + d.getUTCDate()).slice(-2)
      return year + '-' + month + '-' + day
    }

    var tomorrowStr = toDateString(tomorrow)
    var dayAfterStr = toDateString(dayAfter)

    var folders = []
    try {
      folders = $app.findRecordsByFilter(
        'folders',
        "investor_id = '" +
          investorId +
          "' && owner_transfer_date >= '" +
          tomorrowStr +
          "' && owner_transfer_date <= '" +
          dayAfterStr +
          "'",
        'owner_transfer_date',
        100,
        0,
      )
    } catch (err) {
      return e.json(200, [])
    }

    var result = []
    for (var i = 0; i < folders.length; i++) {
      var folder = folders[i]

      var insurerName = '-'
      try {
        var insurerId = folder.getString('insurer_id')
        if (insurerId) {
          var insurer = $app.findRecordById('insurers', insurerId)
          insurerName = insurer.getString('name')
        }
      } catch (_) {}

      result.push({
        id: folder.id,
        contract_number: folder.getString('contract_number'),
        owner_name: folder.getString('owner_name') || '-',
        insurer_name: insurerName,
        owner_transfer_date: folder.getString('owner_transfer_date') || '',
        investor_share_amount: folder.get('investor_share_amount') || 0,
      })
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)
