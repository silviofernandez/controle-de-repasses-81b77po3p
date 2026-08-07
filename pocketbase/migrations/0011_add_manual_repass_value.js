migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('folders')

    if (!col.fields.getByName('manual_repass_value')) {
      col.fields.add(new NumberField({ name: 'manual_repass_value', min: 0 }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('folders')

    const field = col.fields.getByName('manual_repass_value')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }
  },
)
