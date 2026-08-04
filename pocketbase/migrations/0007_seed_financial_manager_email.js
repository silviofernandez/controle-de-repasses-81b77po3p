migrate(
  (app) => {
    const settingsCol = app.findCollectionByNameOrId('settings')

    try {
      app.findFirstRecordByData('settings', 'key', 'financial_manager_email')
    } catch (_) {
      const r = new Record(settingsCol)
      r.set('key', 'financial_manager_email')
      r.set('value', 'gabsilvio@gmail.com')
      r.set('description', 'E-mail do gestor financeiro para envio de relatórios')
      app.save(r)
    }
  },
  (app) => {
    try {
      const r = app.findFirstRecordByData('settings', 'key', 'financial_manager_email')
      app.delete(r)
    } catch (_) {}
  },
)
