migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['gestor', 'investidor'],
          maxSelect: 1,
        }),
      )
    }
    app.save(users)

    app.save(
      new Collection({
        name: 'profiles',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || user_id = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || user_id = @request.auth.id)",
        createRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'role',
            type: 'select',
            required: true,
            values: ['gestor', 'investidor'],
            maxSelect: 1,
          },
          { name: 'name', type: 'text', required: true },
          { name: 'phone', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_profiles_user_id ON profiles (user_id)'],
      }),
    )

    app.save(
      new Collection({
        name: 'insurers',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'contact_name', type: 'text' },
          { name: 'contact_email', type: 'email' },
          { name: 'contact_phone', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_insurers_name ON insurers (name)'],
      }),
    )

    app.save(
      new Collection({
        name: 'investors',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || user_id = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || user_id = @request.auth.id)",
        createRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        fields: [
          { name: 'user_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'phone', type: 'text' },
          { name: 'document', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_investors_user_id ON investors (user_id)'],
      }),
    )

    app.save(
      new Collection({
        name: 'settings',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        fields: [
          { name: 'key', type: 'text', required: true },
          { name: 'value', type: 'text' },
          { name: 'description', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_settings_key ON settings (key)'],
      }),
    )

    const investorsCol = app.findCollectionByNameOrId('investors')
    const insurersCol = app.findCollectionByNameOrId('insurers')

    app.save(
      new Collection({
        name: 'folders',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || user_id = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || user_id = @request.auth.id)",
        createRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        fields: [
          { name: 'contract_number', type: 'text', required: true },
          {
            name: 'investor_id',
            type: 'relation',
            required: true,
            collectionId: investorsCol.id,
            maxSelect: 1,
          },
          { name: 'insurer_id', type: 'relation', collectionId: insurersCol.id, maxSelect: 1 },
          { name: 'initial_date', type: 'date', required: true },
          { name: 'due_date', type: 'date' },
          { name: 'owner_transfer_date', type: 'date' },
          { name: 'insurer_submission_date', type: 'date' },
          { name: 'estimated_receipt_date', type: 'date' },
          { name: 'actual_receipt_date', type: 'date' },
          { name: 'repassed_date', type: 'date' },
          { name: 'rent_amount', type: 'number', required: true, min: 0 },
          { name: 'surcharge_percent', type: 'number', min: 0 },
          { name: 'investor_percent', type: 'number', min: 0 },
          { name: 'surcharge_amount', type: 'number', min: 0 },
          { name: 'company_share_amount', type: 'number', min: 0 },
          { name: 'investor_share_amount', type: 'number', min: 0 },
          {
            name: 'status',
            type: 'select',
            values: ['pendente', 'transferido', 'subido', 'recebido', 'repassado'],
            maxSelect: 1,
          },
          { name: 'user_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_folders_status ON folders (status)',
          'CREATE INDEX idx_folders_investor ON folders (investor_id)',
          'CREATE INDEX idx_folders_user ON folders (user_id)',
          'CREATE UNIQUE INDEX idx_folders_contract ON folders (contract_number)',
        ],
      }),
    )
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('folders'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('settings'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('investors'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('insurers'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('profiles'))
    } catch (_) {}
  },
)
