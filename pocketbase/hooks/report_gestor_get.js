routerAdd(
  'GET',
  '/backend/v1/reports/gestor',
  (e) => {
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação requerida')

    var startDate = e.request.url.query().get('start_date') || ''
    var endDate = e.request.url.query().get('end_date') || ''
    var insurerId = e.request.url.query().get('insurer_id') || ''

    var parts = []
    if (startDate) parts.push("repassed_date >= '" + startDate + "'")
    if (endDate) parts.push("repassed_date <= '" + endDate + "'")
    if (insurerId && insurerId !== 'all') parts.push("insurer_id = '" + insurerId + "'")
    var filter = parts.length > 0 ? parts.join(' && ') : "id != ''"

    var folders = []
    try {
      folders = $app.findRecordsByFilter('folders', filter, '-repassed_date', 0, 0)
    } catch (err) {
      folders = []
    }

    var totalPaidToOwners = 0
    var totalReceivedFromInsurers = 0
    var totalInvestorShare = 0
    var openFolders = []
    var closedFolders = []

    for (var i = 0; i < folders.length; i++) {
      var folder = folders[i]
      var rentAmount = folder.get('rent_amount') || 0
      var receivedAmount = folder.get('received_amount') || 0
      var investorShare = folder.get('investor_share_amount') || 0
      var status = folder.getString('status') || 'pendente'

      if (folder.getString('owner_transfer_date')) {
        totalPaidToOwners += rentAmount
      }

      if (folder.getString('actual_receipt_date')) {
        totalReceivedFromInsurers += receivedAmount
      }

      totalInvestorShare += investorShare

      var insurerName = ''
      var insId = folder.getString('insurer_id')
      if (insId) {
        try {
          var ins = $app.findRecordById('insurers', insId)
          insurerName = ins.getString('name')
        } catch (_) {}
      }

      var folderData = {
        id: folder.id,
        contract_number: folder.getString('contract_number'),
        owner_name: folder.getString('owner_name') || '',
        insurer_name: insurerName,
        status: status,
        repassed_date: folder.getString('repassed_date') || '',
        due_date: folder.getString('due_date') || '',
        estimated_receipt_date: folder.getString('estimated_receipt_date') || '',
        actual_receipt_date: folder.getString('actual_receipt_date') || '',
        investor_share_amount: investorShare,
        received_amount: receivedAmount,
        rent_amount: rentAmount,
      }

      if (status === 'recebido') {
        closedFolders.push(folderData)
      } else {
        openFolders.push(folderData)
      }
    }

    var totalCompanyShare = totalReceivedFromInsurers - totalInvestorShare

    return e.json(200, {
      indicators: {
        total_paid_to_owners: totalPaidToOwners,
        total_received_from_insurers: totalReceivedFromInsurers,
        total_investor_share: totalInvestorShare,
        total_company_share: totalCompanyShare,
      },
      open_folders: openFolders,
      closed_folders: closedFolders,
      total_folders: folders.length,
    })
  },
  $apis.requireAuth(),
)
