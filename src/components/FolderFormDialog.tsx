import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getInvestors, type InvestorRecord } from '@/services/investors'
import { getInsurers, type InsurerRecord } from '@/services/insurers'
import {
  createFolder,
  updateFolder,
  type FolderRecord,
  type FolderStatus,
} from '@/services/folders'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { InlineSpinner } from '@/components/page-states'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { Link } from 'react-router-dom'
import { ExternalLink, AlertCircle } from 'lucide-react'

interface FolderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: FolderRecord | null
  onSaved?: () => void
}

const statusOptions: { value: FolderStatus; label: string }[] = [
  { value: 'à repassar', label: 'À Repassar' },
  { value: 'garantido', label: 'Garantido' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'em análise', label: 'Em Análise' },
  { value: 'pgto agendado', label: 'Pgto Agendado' },
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function dateOnly(value?: string) {
  return value ? value.split(' ')[0] : ''
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-sm text-destructive">{error}</p>
}

const emptyForm = {
  contract_number: '',
  owner_name: '',
  insurer_id: '',
  due_date: '',
  owner_transfer_date: '',
  repass_value: '',
  status: 'à repassar' as FolderStatus,
  notes: '',
  estimated_receipt_date: '',
  received_amount: '',
  actual_receipt_date: '',
}

export function FolderFormDialog({ open, onOpenChange, folder, onSaved }: FolderFormDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [investor, setInvestor] = useState<InvestorRecord | null>(null)
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingDeps, setLoadingDeps] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const isEditing = !!folder

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    loadDependencies()
    if (folder) {
      const repassValue = folder.manual_repass_value || folder.rent_amount || 0
      setForm({
        ...emptyForm,
        contract_number: folder.contract_number || '',
        owner_name: folder.owner_name || '',
        insurer_id: folder.insurer_id || '',
        due_date: dateOnly(folder.due_date),
        owner_transfer_date: dateOnly(folder.owner_transfer_date),
        repass_value: repassValue.toString(),
        status: folder.status || 'à repassar',
        notes: folder.notes || '',
        estimated_receipt_date: dateOnly(folder.estimated_receipt_date),
        received_amount: folder.received_amount?.toString() || '',
        actual_receipt_date: dateOnly(folder.actual_receipt_date),
      })
    } else {
      setForm({ ...emptyForm })
    }
  }, [open, folder])

  useEffect(() => {
    if (!open) return
    if (form.status === 'recebido' && !form.received_amount) {
      const repass = parseFloat(form.repass_value) || 0
      setForm((prev) => ({
        ...prev,
        received_amount: (repass * 1.2).toFixed(2),
        actual_receipt_date: prev.actual_receipt_date || todayStr(),
      }))
    }
  }, [form.status, form.repass_value, form.received_amount, open])

  const loadDependencies = async () => {
    setLoadingDeps(true)
    try {
      const [inv, ins] = await Promise.all([getInvestors(), getInsurers()])
      setInvestor(inv.length > 0 ? inv[0] : null)
      setInsurers(ins)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' })
    } finally {
      setLoadingDeps(false)
    }
  }

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    if (!isEditing && !investor) {
      toast({
        title: 'Investidor não cadastrado',
        description: 'Cadastre o investidor antes de criar uma pasta.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    setFieldErrors({})
    const repassValue = parseFloat(form.repass_value) || 0
    const data: Record<string, any> = {
      contract_number: form.contract_number,
      owner_name: form.owner_name,
      investor_id: investor?.id || folder?.investor_id,
      insurer_id: form.insurer_id || null,
      initial_date: form.owner_transfer_date || null,
      owner_transfer_date: form.owner_transfer_date || null,
      due_date: form.due_date || null,
      rent_amount: repassValue,
      investor_share_amount: repassValue,
      manual_repass_value: repassValue,
      status: isEditing ? form.status : 'à repassar',
      notes: form.notes,
      user_id: user.id,
    }
    if (isEditing && form.status === 'pgto agendado' && form.estimated_receipt_date) {
      data.estimated_receipt_date = form.estimated_receipt_date
    }
    if (isEditing && form.status === 'recebido') {
      data.received_amount = parseFloat(form.received_amount) || 0
      data.actual_receipt_date = form.actual_receipt_date || todayStr()
    }
    try {
      if (folder) {
        await updateFolder(folder.id, data)
        toast({ title: 'Sucesso', description: 'Pasta atualizada com sucesso.' })
      } else {
        await createFolder(data)
        toast({ title: 'Sucesso', description: 'Pasta criada com sucesso.' })
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) setFieldErrors(errors)
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar pasta.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const noInvestor = !isEditing && !loadingDeps && !investor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{folder ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
        </DialogHeader>
        {noInvestor && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum investidor cadastrado. Cadastre o investidor antes de criar uma pasta.{' '}
              <Link to="/relationships" className="font-semibold underline">
                Ir para cadastro
              </Link>
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_number">Número do Contrato</Label>
              <Input
                id="contract_number"
                value={form.contract_number}
                onChange={(e) => set('contract_number', e.target.value)}
                required
              />
              <FieldError error={fieldErrors.contract_number} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Proprietário</Label>
              <Input
                id="owner_name"
                value={form.owner_name}
                onChange={(e) => set('owner_name', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Seguradora</Label>
            <Select
              value={form.insurer_id}
              onValueChange={(v) => set('insurer_id', v)}
              disabled={loadingDeps}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingDeps ? 'Carregando...' : 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {insurers.map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link
              to="/insurers"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Gerenciar seguradoras
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Data do Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
              <FieldError error={fieldErrors.due_date} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_transfer_date">Data do Repasse para o Proprietário</Label>
              <Input
                id="owner_transfer_date"
                type="date"
                value={form.owner_transfer_date}
                onChange={(e) => set('owner_transfer_date', e.target.value)}
                required
              />
              <FieldError error={fieldErrors.initial_date} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repass_value">Valor do Repasse (R$)</Label>
            <Input
              id="repass_value"
              type="number"
              step="0.01"
              min="0"
              value={form.repass_value}
              onChange={(e) => set('repass_value', e.target.value)}
              required
            />
            <FieldError error={fieldErrors.rent_amount} />
          </div>
          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as FolderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isEditing && form.status === 'pgto agendado' && (
            <div className="space-y-2">
              <Label htmlFor="estimated_receipt_date">Data Prevista de Recebimento</Label>
              <Input
                id="estimated_receipt_date"
                type="date"
                value={form.estimated_receipt_date}
                onChange={(e) => set('estimated_receipt_date', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Informe a data prevista de recebimento informada pela seguradora.
              </p>
            </div>
          )}
          {isEditing && form.status === 'recebido' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="received_amount">Valor Recebido (R$)</Label>
                <Input
                  id="received_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.received_amount}
                  onChange={(e) => set('received_amount', e.target.value)}
                />
                <FieldError error={fieldErrors.received_amount} />
                <p className="text-xs text-muted-foreground">
                  Predefinido com repasse × 1,20. Edite se necessário.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_receipt_date">Data do Recebimento</Label>
                <Input
                  id="actual_receipt_date"
                  type="date"
                  value={form.actual_receipt_date}
                  onChange={(e) => set('actual_receipt_date', e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || noInvestor}>
              {saving ? (
                <>
                  <InlineSpinner className="mr-2" /> Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
