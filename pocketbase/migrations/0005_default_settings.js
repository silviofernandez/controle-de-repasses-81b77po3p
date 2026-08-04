migrate(
  (app) => {
    const settingsCol = app.findCollectionByNameOrId('settings')
    const defaults = [
      {
        key: 'default_surcharge_pct',
        value: '20',
        description: 'Percentual padrão de sobretaxa (20%)',
      },
      {
        key: 'investor_share_pct',
        value: '5',
        description: 'Percentual do investidor (5%)',
      },
      {
        key: 'company_share_pct',
        value: '15',
        description: 'Percentual da empresa (15%)',
      },
    ]
    for (const s of defaults) {
      try {
        app.findFirstRecordByData('settings', 'key', s.key)
      } catch (_) {
        const r = new Record(settingsCol)
        r.set('key', s.key)
        r.set('value', s.value)
        r.set('description', s.description)
        app.save(r)
      }
    }
  },
  (app) => {
    const keys = ['default_surcharge_pct', 'investor_share_pct', 'company_share_pct']
    for (const key of keys) {
      try {
        const r = app.findFirstRecordByData('settings', 'key', key)
        app.delete(r)
      } catch (_) {}
    }
  },
)
