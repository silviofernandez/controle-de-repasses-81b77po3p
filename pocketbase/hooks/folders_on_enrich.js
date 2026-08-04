onRecordEnrich((e) => {
  const role = (e.auth && e.auth.getString('role')) || ''
  if (role !== 'gestor') {
    e.record.set('company_share_amount', null)
    e.record.set('surcharge_amount', null)
    e.record.set('surcharge_percent', null)
    e.record.set('investor_percent', null)
  }
  e.next()
}, 'folders')
