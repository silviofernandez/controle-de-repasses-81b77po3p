routerAdd(
  'GET',
  '/backend/v1/investors/statement',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação requerida')

    let investorId = ''
    try {
      const investor = $app.findFirstRecordByFilter('investors', "user_id = '" + auth.id + "'")
      investorId = investor.id
    } catch (err) {
      return e.json(200, {
        total_guaranteed: 0,
        total_open: 0,
        received_this_month: 0,
        total_to_receive: 0,
        average_ratio: 0,
      })
    }

    let folders = []
    try {
      folders = $app.findRecordsByFilter(
        'folders',
        "investor_id = '" + investorId + "'",
        '-created',
        0,
        0,
      )
    } catch (err) {
      return e.json(200, {
        total_guaranteed: 0,
        total_open: 0,
        received_this_month: 0,
        total_to_receive: 0,
        average_ratio: 0,
      })
    }

    let totalGuaranteed = 0
    let totalOpen = 0
    let receivedThisMonth = 0
    let totalReceived = 0

    const now = new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth() + 1

    for (const folder of folders) {
      const investorShare = folder.get('investor_share_amount') || 0
      const status = folder.getString('status') || 'pendente'
      const repassedDate = folder.getString('repassed_date') || ''

      totalGuaranteed += investorShare

      if (status !== 'repassado') {
        totalOpen += investorShare
      } else {
        totalReceived += investorShare

        if (repassedDate) {
          try {
            const d = new Date(repassedDate)
            if (d.getUTCFullYear() === currentYear && d.getUTCMonth() + 1 === currentMonth) {
              receivedThisMonth += investorShare
            }
          } catch (_) {}
        }
      }
    }

    const totalToReceive = totalOpen
    const averageRatio = totalGuaranteed > 0 ? (totalReceived / totalGuaranteed) * 100 : 0

    return e.json(200, {
      total_guaranteed: totalGuaranteed,
      total_open: totalOpen,
      received_this_month: receivedThisMonth,
      total_to_receive: totalToReceive,
      average_ratio: averageRatio,
    })
  },
  $apis.requireAuth(),
)
