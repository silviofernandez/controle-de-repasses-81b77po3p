routerAdd(
  'GET',
  '/backend/v1/folders/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    if (!id) {
      return e.badRequestError('ID is required')
    }

    try {
      const record = $app.findRecordById('folders', id)
      $app.expandRecord(record, ['investor_id', 'insurer_id', 'user_id'])
      return e.json(200, record)
    } catch (err) {
      return e.notFoundError('Folder not found')
    }
  },
  $apis.requireAuth(),
)
