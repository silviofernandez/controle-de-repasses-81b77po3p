migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('folders')

    if (!col.fields.getByName('punctuality_discount')) {
      col.fields.add(new NumberField({ name: 'punctuality_discount', min: 0 }))
      app.save(col)
    }

    col.addIndex('idx_folders_repassed_date', false, 'repassed_date', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('folders')

    const field = col.fields.getByName('punctuality_discount')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }

    col.removeIndex('idx_folders_repassed_date')
    app.save(col)
  },
)
