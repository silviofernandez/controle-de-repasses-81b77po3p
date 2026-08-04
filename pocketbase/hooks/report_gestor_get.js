routerAdd(
  'GET',
  '/backend/v1/reports/gestor',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação requerida')
    const role = auth.getString('role') || ''
    if (role !== 'gestor') return e.forbiddenError('Acesso restrito a gestores')

    const query = e.requestInfo().query || {}
    const startDate = query.start_date || ''
    const endDate = query.end_date || ''

    if (!startDate || !endDate) {
      return e.badRequestError('Período não informado')
    }

    let folders = []
    try {
      folders = $app.findRecordsByFilter(
        'folders',
        "due_date >= '" + startDate + "' && due_date <= '" + endDate + "'",
        '-due_date',
        0,
        0,
      )
    } catch (err) {
      return e.json(200, {
        indicators: {
          total_paid_to_owners: 0,
          total_received_from_insurers: 0,
          total_investor_share: 0,
          total_company_share: 0,
        },
        open_folders: [],
        total_folders: 0,
      })
    }

    let totalPaidToOwners = 0
    let totalReceivedFromInsurers = 0
    let totalInvestorShare = 0
    const openFolders = []

    const paidStatuses = ['transferido', 'subido', 'recebido', 'repassado']
    const receivedStatuses = ['recebido', 'repassado']

    for (const folder of folders) {
      const rentAmount = folder.get('rent_amount') || 0
      const investorShare = folder.get('investor_share_amount') || 0
      const status = folder.getString('status') || 'pendente'

      if (paidStatuses.indexOf(status) !== -1) {
        totalPaidToOwners += rentAmount
      }

      if (receivedStatuses.indexOf(status) !== -1) {
        totalReceivedFromInsurers += rentAmount
      }

      if (status === 'repassado') {
        totalInvestorShare += investorShare
      }

      if (status !== 'repassado') {
        let insurerName = '-'
        try {
          const insurerId = folder.getString('insurer_id')
          if (insurerId) {
            const insurer = $app.findRecordById('insurers', insurerId)
            insurerName = insurer.getString('name')
          }
        } catch (_) {}

        openFolders.push({
          id: folder.id,
          contract_number: folder.getString('contract_number'),
          owner_name: folder.getString('owner_name') || '-',
          insurer_name: insurerName,
          status: status,
          due_date: folder.getString('due_date') || '',
          estimated_receipt_date: folder.getString('estimated_receipt_date') || '',
        })
      }
    }

    let totalCompanyShare = totalReceivedFromInsurers - totalPaidToOwners - totalInvestorShare
    if (totalCompanyShare < 0) totalCompanyShare = 0

    return e.json(200, {
      indicators: {
        total_paid_to_owners: totalPaidToOwners,
        total_received_from_insurers: totalReceivedFromInsurers,
        total_investor_share: totalInvestorShare,
        total_company_share: totalCompanyShare,
      },
      open_folders: openFolders,
      total_folders: folders.length,
    })
  },
  $apis.requireAuth(),
)
