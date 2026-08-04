migrate(
  (app) => {
    const adminEmail = 'gabsilvio@gmail.com'
    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', adminEmail)
      if (!adminUser.getString('role')) {
        adminUser.set('role', 'gestor')
        app.save(adminUser)
      }
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      adminUser = new Record(users)
      adminUser.setEmail(adminEmail)
      adminUser.setPassword('Skip@Pass')
      adminUser.setVerified(true)
      adminUser.set('name', 'Gestor Admin')
      adminUser.set('role', 'gestor')
      app.save(adminUser)
    }

    let investUser
    try {
      investUser = app.findAuthRecordByEmail('_pb_users_auth_', 'investidor@exemplo.com')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      investUser = new Record(users)
      investUser.setEmail('investidor@exemplo.com')
      investUser.setPassword('Skip@Pass')
      investUser.setVerified(true)
      investUser.set('name', 'João Silva')
      investUser.set('role', 'investidor')
      app.save(investUser)
    }

    const profilesCol = app.findCollectionByNameOrId('profiles')
    try {
      app.findFirstRecordByData('profiles', 'user_id', adminUser.id)
    } catch (_) {
      const p = new Record(profilesCol)
      p.set('user_id', adminUser.id)
      p.set('role', 'gestor')
      p.set('name', 'Gestor Admin')
      app.save(p)
    }
    try {
      app.findFirstRecordByData('profiles', 'user_id', investUser.id)
    } catch (_) {
      const p = new Record(profilesCol)
      p.set('user_id', investUser.id)
      p.set('role', 'investidor')
      p.set('name', 'João Silva')
      app.save(p)
    }

    const insurersCol = app.findCollectionByNameOrId('insurers')
    const insurerNames = ['Porto Seguro', 'Mapfre', 'Allianz']
    const insurerIds = {}
    for (const name of insurerNames) {
      try {
        insurerIds[name] = app.findFirstRecordByData('insurers', 'name', name).id
      } catch (_) {
        const r = new Record(insurersCol)
        r.set('name', name)
        if (name === 'Porto Seguro') {
          r.set('contact_name', 'Carlos Pereira')
          r.set('contact_email', 'carlos@portoseguro.com.br')
          r.set('contact_phone', '(11) 3333-1000')
        }
        if (name === 'Mapfre') {
          r.set('contact_name', 'Ana Costa')
          r.set('contact_email', 'ana@mapfre.com.br')
          r.set('contact_phone', '(11) 3333-2000')
        }
        if (name === 'Allianz') {
          r.set('contact_name', 'Roberto Lima')
          r.set('contact_email', 'roberto@allianz.com.br')
          r.set('contact_phone', '(11) 3333-3000')
        }
        app.save(r)
        insurerIds[name] = r.id
      }
    }

    const investorsCol = app.findCollectionByNameOrId('investors')
    let investor1
    try {
      investor1 = app.findFirstRecordByData('investors', 'name', 'João Silva')
    } catch (_) {
      investor1 = new Record(investorsCol)
      investor1.set('user_id', investUser.id)
      investor1.set('name', 'João Silva')
      investor1.set('email', 'joao.silva@email.com')
      investor1.set('phone', '(11) 98765-4321')
      investor1.set('document', '123.456.789-00')
      app.save(investor1)
    }

    let investor2
    try {
      investor2 = app.findFirstRecordByData('investors', 'name', 'Maria Santos')
    } catch (_) {
      investor2 = new Record(investorsCol)
      investor2.set('name', 'Maria Santos')
      investor2.set('email', 'maria.santos@email.com')
      investor2.set('phone', '(11) 91234-5678')
      investor2.set('document', '987.654.321-00')
      app.save(investor2)
    }

    const settingsCol = app.findCollectionByNameOrId('settings')
    const settingsData = [
      {
        key: 'default_surcharge_percent',
        value: '5',
        description: 'Percentual padrão de sobretaxa',
      },
      {
        key: 'default_investor_percent',
        value: '15',
        description: 'Percentual padrão da empresa (15%)',
      },
      {
        key: 'business_days_for_transfer',
        value: '5',
        description: 'Dias úteis para transferência ao proprietário',
      },
    ]
    for (const s of settingsData) {
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

    function fmtDate(d) {
      return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0') +
        ' 00:00:00.000Z'
      )
    }
    function addBusinessDays(dateStr, n) {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      let c = 0
      while (c < n) {
        d.setDate(d.getDate() + 1)
        if (d.getDay() !== 0 && d.getDay() !== 6) c++
      }
      return fmtDate(d)
    }
    function addDays(dateStr, n) {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      d.setDate(d.getDate() + n)
      return fmtDate(d)
    }
    function calcStatus(
      ownerTransfer,
      insurerSubmission,
      estimatedReceipt,
      actualReceipt,
      repassed,
    ) {
      const now = new Date()
      if (repassed) return 'repassado'
      if (actualReceipt) return 'recebido'
      if (estimatedReceipt && new Date(estimatedReceipt) <= now) return 'recebido'
      if (insurerSubmission && new Date(insurerSubmission) <= now) return 'subido'
      if (ownerTransfer && new Date(ownerTransfer) <= now) return 'transferido'
      return 'pendente'
    }

    const foldersCol = app.findCollectionByNameOrId('folders')
    const seedFolders = [
      {
        contract_number: '2026-001',
        investor: investor1,
        insurer: insurerIds['Porto Seguro'],
        initial_date: '2026-08-04',
        rent_amount: 2500,
      },
      {
        contract_number: '2026-002',
        investor: investor2,
        insurer: insurerIds['Mapfre'],
        initial_date: '2026-07-15',
        rent_amount: 3200,
      },
      {
        contract_number: '2026-003',
        investor: investor1,
        insurer: insurerIds['Allianz'],
        initial_date: '2026-06-01',
        rent_amount: 1800,
      },
    ]
    for (const sf of seedFolders) {
      try {
        app.findFirstRecordByData('folders', 'contract_number', sf.contract_number)
        continue
      } catch (_) {}
      const ot = addBusinessDays(sf.initial_date, 5)
      const is = addDays(ot, 16)
      const er = addDays(is, 45)
      const rent = sf.rent_amount
      const surchargeAmt = rent * 0.05
      const companyAmt = rent * 0.15
      const investorAmt = rent - surchargeAmt - companyAmt
      const r = new Record(foldersCol)
      r.set('contract_number', sf.contract_number)
      r.set('investor_id', sf.investor.id)
      r.set('insurer_id', sf.insurer)
      r.set('initial_date', sf.initial_date + ' 00:00:00.000Z')
      r.set('owner_transfer_date', ot)
      r.set('insurer_submission_date', is)
      r.set('estimated_receipt_date', er)
      r.set('rent_amount', rent)
      r.set('surcharge_percent', 5)
      r.set('investor_percent', 15)
      r.set('surcharge_amount', surchargeAmt)
      r.set('company_share_amount', companyAmt)
      r.set('investor_share_amount', investorAmt)
      r.set('status', calcStatus(ot, is, er, '', ''))
      r.set('user_id', sf.investor.getString('user_id'))
      app.save(r)
    }
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('folders'))
    } catch (_) {}
    try {
      app.truncateCollection(app.findCollectionByNameOrId('settings'))
    } catch (_) {}
    try {
      app.truncateCollection(app.findCollectionByNameOrId('investors'))
    } catch (_) {}
    try {
      app.truncateCollection(app.findCollectionByNameOrId('insurers'))
    } catch (_) {}
    try {
      app.truncateCollection(app.findCollectionByNameOrId('profiles'))
    } catch (_) {}
  },
)
