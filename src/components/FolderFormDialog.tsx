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

interface FolderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: FolderRecord | null
  onSaved?: () => void
}

const statusOptions: { value: FolderStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'transferido', label: 'Transferido' },
  { value: 'subido', label: 'Subido' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'repassado', label: 'Repassado' },
]

export function FolderFormDialog({ open, onOpenChange, folder, onSaved }: FolderFormDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [investors, setInvestors] = useState<InvestorRecord[]>([])
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    contract_number: '',
    owner_name: '',
    investor_id: '',
    insurer_id: '',
    initial_date: '',
    due_date: '',
    owner_transfer_date: '',
    insurer_submission_date: '',
    estimated_receipt_date: '',
    actual_receipt_date: '',
    repassed_date: '',
    rent_amount: '',
    investor_share_amount: '',
    status: 'pendente' as FolderStatus,
    notes: '',
  })

  useEffect(() => {
    if (open) {
      loadDependencies()
      if (folder) {
        setForm({
          contract_number: folder.contract_number || '',
          owner_name: folder.owner_name || '',
          investor_id: folder.investor_id || '',
          insurer_id: folder.insurer_id || '',
          initial_date: folder.initial_date || '',
          due_date: folder.due_date || '',
          owner_transfer_date: folder.owner_transfer_date || '',
          insurer_submission_date: folder.insurer_submission_date || '',
          estimated_receipt_date: folder.estimated_receipt_date || '',
          actual_receipt_date: folder.actual_receipt_date || '',
          repassed_date: folder.repassed_date || '',
          rent_amount: folder.rent_amount?.toString() || '',
          investor_share_amount: folder.investor_share_amount?.toString() || '',
          status: folder.status || 'pendente',
          notes: folder.notes || '',
        })
      } else {
        setForm({
          contract_number: '',
          owner_name: '',
          investor_id: '',
          insurer_id: '',
          initial_date: '',
          due_date: '',
          owner_transfer_date: '',
          insurer_submission_date: '',
          estimated_receipt_date: '',
          actual_receipt_date: '',
          repassed_date: '',
          rent_amount: '',
          investor_share_amount: '',
          status: 'pendente',
          notes: '',
        })
      }
    }
  }, [open, folder])

  const loadDependencies = async () => {
    try {
      const [inv, ins] = await Promise.all([getInvestors(), getInsurers()])
      setInvestors(inv)
      setInsurers(ins)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)

    const data: Record<string, any> = {
      contract_number: form.contract_number,
      owner_name: form.owner_name,
      investor_id: form.investor_id,
      insurer_id: form.insurer_id,
      initial_date: form.initial_date || null,
      due_date: form.due_date || null,
      owner_transfer_date: form.owner_transfer_date || null,
      insurer_submission_date: form.insurer_submission_date || null,
      estimated_receipt_date: form.estimated_receipt_date || null,
      actual_receipt_date: form.actual_receipt_date || null,
      repassed_date: form.repassed_date || null,
      rent_amount: form.rent_amount ? parseFloat(form.rent_amount) : 0,
      investor_share_amount: form.investor_share_amount
        ? parseFloat(form.investor_share_amount)
        : 0,
      status: form.status,
      notes: form.notes,
      user_id: user.id,
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
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar pasta.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{folder ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_number">Número do Contrato</Label>
              <Input
                id="contract_number"
                value={form.contract_number}
                onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Proprietário</Label>
              <Input
                id="owner_name"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Investidor</Label>
              <Select
                value={form.investor_id}
                onValueChange={(v) => setForm({ ...form, investor_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seguradora</Label>
              <Select
                value={form.insurer_id}
                onValueChange={(v) => setForm({ ...form, insurer_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {insurers.map((ins) => (
                    <SelectItem key={ins.id} value={ins.id}>
                      {ins.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_date">Data Inicial</Label>
              <Input
                id="initial_date"
                type="date"
                value={form.initial_date}
                onChange={(e) => setForm({ ...form, initial_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent_amount">Valor do Aluguel (R$)</Label>
              <Input
                id="rent_amount"
                type="number"
                step="0.01"
                value={form.rent_amount}
                onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investor_share_amount">Repasse do Investidor (R$)</Label>
              <Input
                id="investor_share_amount"
                type="number"
                step="0.01"
                value={form.investor_share_amount}
                onChange={(e) => setForm({ ...form, investor_share_amount: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as FolderStatus })}
            >
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

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
