migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('folders')
    const fieldsToHide = [
      'company_share_amount',
      'surcharge_amount',
      'surcharge_percent',
      'investor_percent',
    ]
    for (const fieldName of fieldsToHide) {
      const field = col.fields.getByName(fieldName)
      if (field) {
        field.hidden = true
      }
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('folders')
    const fieldsToUnhide = [
      'company_share_amount',
      'surcharge_amount',
      'surcharge_percent',
      'investor_percent',
    ]
    for (const fieldName of fieldsToUnhide) {
      const field = col.fields.getByName(fieldName)
      if (field) {
        field.hidden = false
      }
    }
    app.save(col)
  },
)
