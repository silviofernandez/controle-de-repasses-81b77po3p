migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE folders SET status = 'à repassar' WHERE status = 'pendente'")
      .execute()
    app
      .db()
      .newQuery("UPDATE folders SET status = 'garantido' WHERE status = 'transferido'")
      .execute()
    app
      .db()
      .newQuery("UPDATE folders SET status = 'garantido' WHERE status = 'repassado'")
      .execute()
    app.db().newQuery("UPDATE folders SET status = 'em análise' WHERE status = 'subido'").execute()

    var col = app.findCollectionByNameOrId('folders')
    var statusField = col.fields.getByName('status')
    col.fields.removeById(statusField.id)
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['à repassar', 'garantido', 'recebido', 'em análise', 'pgto agendado'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    app
      .db()
      .newQuery("UPDATE folders SET status = 'pendente' WHERE status = 'à repassar'")
      .execute()
    app
      .db()
      .newQuery("UPDATE folders SET status = 'repassado' WHERE status = 'garantido'")
      .execute()
    app.db().newQuery("UPDATE folders SET status = 'subido' WHERE status = 'em análise'").execute()
    app
      .db()
      .newQuery("UPDATE folders SET status = 'pendente' WHERE status = 'pgto agendado'")
      .execute()

    var col = app.findCollectionByNameOrId('folders')
    var statusField = col.fields.getByName('status')
    col.fields.removeById(statusField.id)
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['pendente', 'transferido', 'subido', 'recebido', 'repassado'],
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
)
