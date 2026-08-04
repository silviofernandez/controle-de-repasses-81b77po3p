migrate(
  (app) => {
    const foldersCol = app.findCollectionByNameOrId('folders')
    if (!foldersCol.fields.getByName('received_amount')) {
      foldersCol.fields.add(new NumberField({ name: 'received_amount', min: 0 }))
      app.save(foldersCol)
    }

    const mariaEmail = 'maria.santos@exemplo.com'
    let mariaUser
    try {
      mariaUser = app.findAuthRecordByEmail('_pb_users_auth_', mariaEmail)
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      mariaUser = new Record(users)
      mariaUser.setEmail(mariaEmail)
      mariaUser.setPassword('Skip@Pass')
      mariaUser.setVerified(true)
      mariaUser.set('name', 'Maria Santos')
      mariaUser.set('role', 'investidor')
      app.save(mariaUser)
    }

    let mariaInvestor
    try {
      mariaInvestor = app.findFirstRecordByData('investors', 'name', 'Maria Santos')
      if (!mariaInvestor.getString('user_id')) {
        mariaInvestor.set('user_id', mariaUser.id)
        app.save(mariaInvestor)
      }
    } catch (_) {
      const investorsCol = app.findCollectionByNameOrId('investors')
      mariaInvestor = new Record(investorsCol)
      mariaInvestor.set('user_id', mariaUser.id)
      mariaInvestor.set('name', 'Maria Santos')
      mariaInvestor.set('email', mariaEmail)
      mariaInvestor.set('phone', '(11) 91234-5678')
      mariaInvestor.set('document', '987.654.321-00')
      app.save(mariaInvestor)
    }

    try {
      app.findFirstRecordByData('profiles', 'user_id', mariaUser.id)
    } catch (_) {
      const profilesCol = app.findCollectionByNameOrId('profiles')
      const p = new Record(profilesCol)
      p.set('user_id', mariaUser.id)
      p.set('role', 'investidor')
      p.set('name', 'Maria Santos')
      app.save(p)
    }

    try {
      const folder = app.findFirstRecordByData('folders', 'contract_number', '2026-002')
      if (folder && folder.getString('user_id') !== mariaUser.id) {
        folder.set('user_id', mariaUser.id)
        app.save(folder)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('folders')
      const field = col.fields.getByName('received_amount')
      if (field) {
        col.fields.removeById(field.id)
        app.save(col)
      }
    } catch (_) {}
  },
)
