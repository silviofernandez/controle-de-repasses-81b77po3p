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

    var monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    var byInvestor = {}

    function ensureInvestor(id) {
      if (!byInvestor[id]) {
        var monthly = []
        for (var m = 0; m < 12; m++) {
          monthly.push({
            month: m,
            month_label: monthNames[m],
            total_repasse: 0,
            total_received: 0,
            profit: 0,
            investor_share: 0,
            company_share: 0,
          })
        }
        byInvestor[id] = {
          investor_id: id,
          investor_name: '',
          total_repasse: 0,
          total_received: 0,
          folder_count: 0,
          monthly: monthly,
        }
      }
    }

    for (var i = 0; i < folders.length; i++) {
      var folder = folders[i]
      var investorId = folder.getString('investor_id')
      if (!investorId) continue

      var repassedDate = folder.getString('repassed_date') || ''
      var actualReceiptDate = folder.getString('actual_receipt_date') || ''

      var repassedInYear = repassedDate >= startOfYear && repassedDate <= endOfYear
      var receivedInYear = actualReceiptDate >= startOfYear && actualReceiptDate <= endOfYear

      if (!repassedInYear && !receivedInYear) continue

      ensureInvestor(investorId)

      var manualRepass = folder.get('manual_repass_value') || 0
      var rentAmount = folder.get('rent_amount') || 0
      var repasseValue = manualRepass > 0 ? manualRepass : rentAmount
      var receivedAmount = folder.get('received_amount') || 0

      if (repassedInYear) {
        byInvestor[investorId].total_repasse += repasseValue
        byInvestor[investorId].folder_count++
        var repassedMonth = parseInt(repassedDate.substring(5, 7), 10) - 1
        if (repassedMonth >= 0 && repassedMonth < 12) {
          byInvestor[investorId].monthly[repassedMonth].total_repasse += repasseValue
        }
      }
      if (receivedInYear) {
        byInvestor[investorId].total_received += receivedAmount
        var receivedMonth = parseInt(actualReceiptDate.substring(5, 7), 10) - 1
        if (receivedMonth >= 0 && receivedMonth < 12) {
          byInvestor[investorId].monthly[receivedMonth].total_received += receivedAmount
        }
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
    var totalsMonthly = []
    for (var tm = 0; tm < 12; tm++) {
      totalsMonthly.push({
        month: tm,
        month_label: monthNames[tm],
        total_repasse: 0,
        total_received: 0,
        profit: 0,
        investor_share: 0,
        company_share: 0,
      })
    }

    var keys = Object.keys(byInvestor)
    for (var j = 0; j < keys.length; j++) {
      var inv = byInvestor[keys[j]]

      for (var k = 0; k < 12; k++) {
        inv.monthly[k].profit = inv.monthly[k].total_received - inv.monthly[k].total_repasse
        inv.monthly[k].investor_share = inv.monthly[k].profit * 0.25
        inv.monthly[k].company_share = inv.monthly[k].profit * 0.75
        totalsMonthly[k].total_repasse += inv.monthly[k].total_repasse
        totalsMonthly[k].total_received += inv.monthly[k].total_received
        totalsMonthly[k].profit += inv.monthly[k].profit
        totalsMonthly[k].investor_share += inv.monthly[k].investor_share
        totalsMonthly[k].company_share += inv.monthly[k].company_share
      }

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
        monthly: inv.monthly,
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

    return e.json(200, {
      year: year,
      investors: investors,
      totals: totals,
      totals_monthly: totalsMonthly,
    })
  },
  $apis.requireAuth(),
)
