routerAdd(
  'GET',
  '/backend/v1/investors/{investorId}/folders',
  (e) => {
    const investorId = e.request.pathValue('investorId')
    if (!investorId) {
      return e.badRequestError('Investor ID is required')
    }

    try {
      const records = $app.findRecordsByFilter(
        'folders',
        "investor_id = '" + investorId + "'",
        '-created',
        100,
        0,
      )

      for (const record of records) {
        $app.expandRecord(record, ['investor_id', 'insurer_id', 'user_id'])
      }

      return e.json(200, records)
    } catch (err) {
      return e.json(200, [])
    }
  },
  $apis.requireAuth(),
)
