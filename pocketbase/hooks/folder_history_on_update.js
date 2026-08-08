onRecordUpdateRequest((e) => {
  try {
    var record = e.record
    var authId = e.auth ? e.auth.id : ''
    var fieldsToTrack = ['received_amount', 'estimated_receipt_date']
    var historyCol = $app.findCollectionByNameOrId('folder_history')

    for (var i = 0; i < fieldsToTrack.length; i++) {
      var fieldName = fieldsToTrack[i]
      var oldValue = record.original().getString(fieldName)
      var newValue = record.getString(fieldName)

      if (oldValue !== newValue) {
        var hr = new Record(historyCol)
        hr.set('folder_id', record.id)
        hr.set('field_name', fieldName)
        hr.set('old_value', oldValue || '')
        hr.set('new_value', newValue || '')
        if (authId) {
          hr.set('changed_by', authId)
        }
        $app.save(hr)
      }
    }
  } catch (err) {
    $app.logger().error('folder_history tracking failed', 'error', String(err))
  }

  e.next()
}, 'folders')
