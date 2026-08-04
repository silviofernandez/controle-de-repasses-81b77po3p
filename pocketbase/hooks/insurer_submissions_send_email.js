routerAdd(
  'POST',
  '/backend/v1/insurer-submissions/send-email',
  (e) => {
    const body = e.requestInfo().body || {}

    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação requerida')
    const role = auth.getString('role') || ''
    if (role !== 'gestor') return e.forbiddenError('Acesso restrito a gestores')

    const dateStr = body.date || ''
    let todayStr = dateStr
    if (!todayStr) {
      const now = new Date()
      var month = now.getMonth() + 1
      var day = now.getDate()
      var monthStr = month < 10 ? '0' + month : '' + month
      var dayStr = day < 10 ? '0' + day : '' + day
      todayStr = now.getFullYear() + '-' + monthStr + '-' + dayStr
    }

    const folders = $app.findRecordsByFilter(
      'folders',
      "insurer_submission_date = '" + todayStr + "'",
      'contract_number',
      0,
      0,
    )

    if (folders.length === 0) {
      return e.json(200, { success: true, message: 'Nenhuma pasta para envio hoje.', count: 0 })
    }

    let rows = ''
    for (const folder of folders) {
      const contractNumber = folder.getString('contract_number')
      const ownerName = folder.getString('owner_name') || '-'
      let insurerName = '-'
      try {
        const insurerId = folder.getString('insurer_id')
        if (insurerId) {
          const insurer = $app.findRecordById('insurers', insurerId)
          insurerName = insurer.getString('name')
        }
      } catch (_) {}
      rows +=
        '<tr><td>' +
        contractNumber +
        '</td><td>' +
        ownerName +
        '</td><td>' +
        insurerName +
        '</td></tr>'
    }

    const htmlReport =
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de Envio à Seguradora</title>' +
      '<style>body{font-family:Arial,sans-serif;margin:40px;color:#333}h1{font-size:24px;margin-bottom:8px}' +
      '.date{font-size:14px;color:#666;margin-bottom:24px}table{width:100%;border-collapse:collapse}' +
      'th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #ddd}' +
      'th{background:#f5f5f5;font-weight:600;font-size:13px;text-transform:uppercase}td{font-size:14px}</style></head>' +
      '<body><h1>Relatório de Envio à Seguradora</h1><p class="date">Data: ' +
      todayStr +
      '</p>' +
      '<table><thead><tr><th>Nº da Pasta</th><th>Proprietário</th><th>Seguradora</th></tr></thead><tbody>' +
      rows +
      '</tbody></table></body></html>'

    let email = ''
    try {
      const setting = $app.findFirstRecordByData('settings', 'key', 'financial_manager_email')
      email = setting.getString('value')
    } catch (_) {}

    if (!email) {
      return e.json(400, {
        success: false,
        message: 'E-mail do gestor financeiro não configurado.',
      })
    }

    const apiKey = $secrets.get('RESEND_API_KEY') || ''
    if (!apiKey) {
      return e.json(500, { success: false, message: 'Chave da API Resend não configurada.' })
    }

    let res
    try {
      res = $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [email],
          subject: 'Relatório de Envio à Seguradora - ' + todayStr,
          html: htmlReport,
        }),
        timeout: 30,
      })
    } catch (err) {
      $app.logger().error('Resend request failed', 'error', String(err))
      return e.json(500, { success: false, message: 'Falha ao conectar com o serviço de e-mail.' })
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return e.json(200, {
        success: true,
        message: 'Relatório enviado por e-mail com sucesso.',
        count: folders.length,
      })
    }

    $app
      .logger()
      .error(
        'Resend API error',
        'status',
        res.statusCode,
        'body',
        res.body ? res.body.substring(0, 500) : '',
      )
    return e.json(res.statusCode, { success: false, message: 'Falha ao enviar e-mail via Resend.' })
  },
  $apis.requireAuth(),
)
