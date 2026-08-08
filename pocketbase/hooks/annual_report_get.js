routerAdd(
  'GET',
  '/backend/v1/reports/annual',
  (e) => {
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação requerida')

    var yearStr = e.request.url.query().get('year')
    var year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear()
    var startOfYear = year + '-01-01'
    var endOfYear = year + '-12-31'

    var folders = []
    try {
      folders = $app.findRecordsByFilter('folders', "id != ''", '-repassed_date', 0, 0)
    } catch (err) {
      folders = []
    }

    var byInvestor = {}

    for (var i = 0; i < folders.length; i++) {
      var folder = folders[i]
      var investorId = folder.getString('investor_id')
      if (!investorId) continue

      var repassedDate = folder.getString('repassed_date') || ''
      var actualReceiptDate = folder.getString('actual_receipt_date') || ''

      var repassedInYear = repassedDate >= startOfYear && repassedDate <= endOfYear
      var receivedInYear = actualReceiptDate >= startOfYear && actualReceiptDate <= endOfYear

      if (!repassedInYear && !receivedInYear) continue

      if (!byInvestor[investorId]) {
        byInvestor[investorId] = {
          investor_id: investorId,
          investor_name: '',
          total_repasse: 0,
          total_received: 0,
          folder_count: 0,
        }
      }

      var manualRepass = folder.get('manual_repass_value') || 0
      var rentAmount = folder.get('rent_amount') || 0
      var repasseValue = manualRepass > 0 ? manualRepass : rentAmount
      var receivedAmount = folder.get('received_amount') || 0

      if (repassedInYear) {
        byInvestor[investorId].total_repasse += repasseValue
        byInvestor[investorId].folder_count++
      }
      if (receivedInYear) {
        byInvestor[investorId].total_received += receivedAmount
      }

      if (!byInvestor[investorId].investor_name) {
        try {
          var investor = $app.findRecordById('investors', investorId)
          byInvestor[investorId].investor_name = investor.getString('name')
        } catch (_) {}
      }
    }

    var investors = []
    var totals = {
      total_repasse: 0,
      total_received: 0,
      profit: 0,
      investor_share: 0,
      company_share: 0,
      folder_count: 0,
    }

    var keys = Object.keys(byInvestor)
    for (var j = 0; j < keys.length; j++) {
      var inv = byInvestor[keys[j]]
      var profit = inv.total_received - inv.total_repasse
      var investorShare = profit * 0.25
      var companyShare = profit * 0.75

      investors.push({
        investor_id: inv.investor_id,
        investor_name: inv.investor_name || 'N/A',
        total_repasse: inv.total_repasse,
        total_received: inv.total_received,
        profit: profit,
        investor_share: investorShare,
        company_share: companyShare,
        folder_count: inv.folder_count,
      })

      totals.total_repasse += inv.total_repasse
      totals.total_received += inv.total_received
      totals.profit += profit
      totals.investor_share += investorShare
      totals.company_share += companyShare
      totals.folder_count += inv.folder_count
    }

    investors.sort(function (a, b) {
      return b.total_repasse - a.total_repasse
    })

    return e.json(200, { year: year, investors: investors, totals: totals })
  },
  $apis.requireAuth(),
)
