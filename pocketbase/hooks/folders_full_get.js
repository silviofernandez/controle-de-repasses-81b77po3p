routerAdd(
  'GET',
  '/backend/v1/folders/{id}/full',
  (e) => {
    const id = e.request.pathValue('id')
    let record
    try {
      record = $app.findRecordById('folders', id)
    } catch (err) {
      return e.notFoundError('Pasta não encontrada')
    }

    const data = {
      id: record.id,
      created: record.getString('created'),
      updated: record.getString('updated'),
      contract_number: record.getString('contract_number'),
      owner_name: record.getString('owner_name'),
      investor_id: record.getString('investor_id'),
      insurer_id: record.getString('insurer_id'),
      initial_date: record.getString('initial_date'),
      due_date: record.getString('due_date'),
      owner_transfer_date: record.getString('owner_transfer_date'),
      insurer_submission_date: record.getString('insurer_submission_date'),
      estimated_receipt_date: record.getString('estimated_receipt_date'),
      actual_receipt_date: record.getString('actual_receipt_date'),
      repassed_date: record.getString('repassed_date'),
      rent_amount: record.get('rent_amount') || 0,
      received_amount: record.get('received_amount') || 0,
      surcharge_percent: record.get('surcharge_percent') || 0,
      investor_percent: record.get('investor_percent') || 0,
      surcharge_amount: record.get('surcharge_amount') || 0,
      company_share_amount: record.get('company_share_amount') || 0,
      investor_share_amount: record.get('investor_share_amount') || 0,
      punctuality_discount: record.get('punctuality_discount') || 0,
      manual_repass_value: record.get('manual_repass_value') || 0,
      status: record.getString('status'),
      notes: record.getString('notes'),
      expand: {},
    }

    try {
      const invId = record.getString('investor_id')
      if (invId) {
        const inv = $app.findRecordById('investors', invId)
        data.expand.investor_id = { id: inv.id, name: inv.getString('name') }
      }
    } catch (_) {}
    try {
      const insId = record.getString('insurer_id')
      if (insId) {
        const ins = $app.findRecordById('insurers', insId)
        data.expand.insurer_id = { id: ins.id, name: ins.getString('name') }
      }
    } catch (_) {}

    return e.json(200, data)
  },
  $apis.requireAuth(),
)
