routerAdd(
  'GET',
  '/backend/v1/investor-folders',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')

    const role = (e.auth && e.auth.getString('role')) || ''

    const allFolders = $app.findRecordsByFilter('folders', '', '-created', 1000, 0)
    const folders =
      role === 'gestor'
        ? allFolders
        : allFolders.filter(function (r) {
            return r.getString('user_id') === userId
          })

    const investorFields = [
      'id',
      'contract_number',
      'investor_id',
      'insurer_id',
      'initial_date',
      'due_date',
      'owner_transfer_date',
      'insurer_submission_date',
      'estimated_receipt_date',
      'actual_receipt_date',
      'rent_amount',
      'investor_share_amount',
      'status',
      'notes',
      'created',
      'updated',
    ]

    const gestorFields = investorFields.concat([
      'repassed_date',
      'surcharge_percent',
      'investor_percent',
      'surcharge_amount',
      'company_share_amount',
      'user_id',
    ])

    const fields = role === 'gestor' ? gestorFields : investorFields

    const result = folders.map(function (r) {
      const obj = {}
      for (let i = 0; i < fields.length; i++) {
        obj[fields[i]] = r.get(fields[i])
      }
      obj.expand = {}
      try {
        const inv = $app.findRecordById('investors', r.getString('investor_id'))
        obj.expand.investor_id = { id: inv.id, name: inv.getString('name') }
      } catch (_) {}
      try {
        const insId = r.getString('insurer_id')
        if (insId) {
          const ins = $app.findRecordById('insurers', insId)
          obj.expand.insurer_id = { id: ins.id, name: ins.getString('name') }
        }
      } catch (_) {}
      return obj
    })

    return e.json(200, { items: result })
  },
  $apis.requireAuth(),
)
