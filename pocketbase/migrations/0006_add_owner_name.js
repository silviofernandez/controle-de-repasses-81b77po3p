migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('folders')
    if (!col.fields.getByName('owner_name')) {
      col.fields.add(new TextField({ name: 'owner_name' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('folders')
    const field = col.fields.getByName('owner_name')
    if (field) {
      col.fields.removeById(field.id)
    }
    app.save(col)
  },
)
