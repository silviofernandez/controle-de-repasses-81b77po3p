migrate(
  (app) => {
    const foldersCol = app.findCollectionByNameOrId('folders')

    app.save(
      new Collection({
        name: 'folder_history',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || folder_id.user_id = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor' || folder_id.user_id = @request.auth.id)",
        createRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'gestor'",
        fields: [
          {
            name: 'folder_id',
            type: 'relation',
            required: true,
            collectionId: foldersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'field_name', type: 'text', required: true },
          { name: 'old_value', type: 'text' },
          { name: 'new_value', type: 'text' },
          { name: 'changed_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_folder_history_folder ON folder_history (folder_id)'],
      }),
    )
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('folder_history'))
    } catch (_) {}
  },
)
