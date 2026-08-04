onRecordListRequest((e) => {
  const role = (e.auth && e.auth.getString('role')) || ''
  if (role !== 'gestor' && e.records) {
    for (const record of e.records) {
      record.set('company_share_amount', null)
      record.set('surcharge_amount', null)
      record.set('surcharge_percent', null)
      record.set('investor_percent', null)
    }
  }
  e.next()
}, 'folders')
