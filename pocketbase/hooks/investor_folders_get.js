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

    const publicFields = [
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
      'surcharge_percent',
      'surcharge_amount',
      'investor_share_amount',
      'status',
      'notes',
      'created',
      'updated',
    ]

    const result = folders.map(function (r) {
      const obj = {}
      for (let i = 0; i < publicFields.length; i++) {
        obj[publicFields[i]] = r.get(publicFields[i])
      }
      return obj
    })

    return e.json(200, { items: result })
  },
  $apis.requireAuth(),
)
