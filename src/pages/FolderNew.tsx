import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, CheckCircle2, Plus, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { createFolder, getFolderFull, type Folder } from '@/services/folders'
import { getInvestors, type Investor } from '@/services/investors'
import { getInsurers, type Insurer } from '@/services/insurers'

const formatCurrency = (v?: number) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'

const formatDate = (s?: string) => {
  if (!s) return '—'
  try {
    return format(parseISO(s), 'dd/MM/yyyy')
  } catch {
    return s
  }
}

const statusConfig: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-700',
  transferido: 'bg-blue-100 text-blue-700',
  subido: 'bg-purple-100 text-purple-700',
  recebido: 'bg-cyan-100 text-cyan-700',
  repassado: 'bg-emerald-100 text-emerald-700',
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function FolderNew() {
  const navigate = useNavigate()
  const [investors, setInvestors] = useState<Investor[]>([])
  const [insurers, setInsurers] = useState<Insurer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedFolder, setSavedFolder] = useState<Folder | null>(null)
  const [form, setForm] = useState({
    contract_number: '',
    owner_name: '',
    investor_id: '',
    insurer_id: '',
    initial_date: '',
    due_date: '',
    rent_amount: 0,
  })

  useEffect(() => {
    Promise.all([getInvestors(), getInsurers()])
      .then(([inv, ins]) => {
        setInvestors(inv)
        setInsurers(ins)
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.contract_number || !form.investor_id || !form.initial_date || !form.rent_amount) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    setSaving(true)
    try {
      const data: Record<string, any> = {
        contract_number: form.contract_number,
        owner_name: form.owner_name || undefined,
        investor_id: form.investor_id,
        insurer_id: form.insurer_id || undefined,
        initial_date: form.initial_date,
        due_date: form.due_date || undefined,
        rent_amount: form.rent_amount,
      }
      const result = await createFolder(data)
      let saved: Folder
      try {
        saved = await getFolderFull(result.id)
      } catch {
        saved = result as unknown as Folder
      }
      setSavedFolder(saved)
      toast.success('Pasta criada com sucesso!')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar pasta')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSavedFolder(null)
    setForm({
      contract_number: '',
      owner_name: '',
      investor_id: '',
      insurer_id: '',
      initial_date: '',
      due_date: '',
      rent_amount: 0,
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (savedFolder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Pasta criada com sucesso!</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Valores Calculados</span>
              <span
                className={`text-sm px-3 py-1 rounded-full capitalize ${
                  statusConfig[savedFolder.status] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {savedFolder.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoBox
                label="Transferência ao Proprietário"
                value={formatDate(savedFolder.owner_transfer_date)}
              />
              <InfoBox
                label="Subida para Seguradora"
                value={formatDate(savedFolder.insurer_submission_date)}
              />
              <InfoBox
                label="Recebimento Estimado"
                value={formatDate(savedFolder.estimated_receipt_date)}
              />
            </div>
            <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoBox label="Valor do Aluguel" value={formatCurrency(savedFolder.rent_amount)} />
              <InfoBox
                label={`Sobretaxa (${savedFolder.surcharge_percent || 5}%)`}
                value={formatCurrency(savedFolder.surcharge_amount)}
              />
              <InfoBox
                label={`Participação da Empresa (${savedFolder.investor_percent || 15}%)`}
                value={formatCurrency(savedFolder.company_share_amount)}
              />
              <InfoBox
                label="Repasse ao Investidor"
                value={formatCurrency(savedFolder.investor_share_amount)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleReset} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Pasta
              </Button>
              <Button
                onClick={() => navigate('/folders')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <List className="h-4 w-4 mr-2" />
                Ver Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/folders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nova Pasta</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados da Pasta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Número da Pasta *</Label>
            <Input
              value={form.contract_number}
              onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nome do Proprietário</Label>
            <Input
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Investidor *</Label>
            <Select
              value={form.investor_id}
              onValueChange={(v) => setForm({ ...form, investor_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {investors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Seguradora</Label>
            <Select
              value={form.insurer_id}
              onValueChange={(v) => setForm({ ...form, insurer_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {insurers.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data Inicial *</Label>
              <Input
                type="date"
                value={form.initial_date}
                onChange={(e) => setForm({ ...form, initial_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento do Aluguel</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor do Aluguel Repassado (R$) *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.rent_amount}
              onChange={(e) => setForm({ ...form, rent_amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate('/folders')}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
