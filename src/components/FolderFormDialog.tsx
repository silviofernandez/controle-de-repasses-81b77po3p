import { useState, useEffect } from 'react'
import { toast } from 'sonner'
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { createFolder, updateFolder, type Folder } from '@/services/folders'
import type { Investor } from '@/services/investors'
import type { Insurer } from '@/services/insurers'

interface FolderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  investors: Investor[]
  insurers: Insurer[]
  folder?: Folder | null
  onSaved: () => void
}

export function FolderFormDialog({
  open,
  onOpenChange,
  investors,
  insurers,
  folder,
  onSaved,
}: FolderFormDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    contract_number: '',
    investor_id: '',
    insurer_id: '',
    initial_date: '',
    due_date: '',
    rent_amount: 0,
    notes: '',
  })

  useEffect(() => {
    if (folder) {
      setForm({
        contract_number: folder.contract_number || '',
        investor_id: folder.investor_id || '',
        insurer_id: folder.insurer_id || '',
        initial_date: folder.initial_date ? folder.initial_date.split(' ')[0].split('T')[0] : '',
        due_date: folder.due_date ? folder.due_date.split(' ')[0].split('T')[0] : '',
        rent_amount: folder.rent_amount || 0,
        notes: folder.notes || '',
      })
    } else {
      setForm({
        contract_number: '',
        investor_id: '',
        insurer_id: '',
        initial_date: '',
        due_date: '',
        rent_amount: 0,
        notes: '',
      })
    }
  }, [folder, open])

  const handleSubmit = async () => {
    if (!form.contract_number || !form.investor_id || !form.initial_date || !form.rent_amount) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    setSaving(true)
    try {
      const data: Record<string, any> = {
        contract_number: form.contract_number,
        investor_id: form.investor_id,
        insurer_id: form.insurer_id || undefined,
        initial_date: form.initial_date,
        due_date: form.due_date || undefined,
        rent_amount: form.rent_amount,
        notes: form.notes || undefined,
      }
      if (folder) {
        await updateFolder(folder.id, data)
        toast.success('Pasta atualizada com sucesso')
      } else {
        await createFolder(data)
        toast.success('Pasta criada com sucesso')
      }
      onOpenChange(false)
      onSaved()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar pasta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{folder ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Número do Contrato *</Label>
            <Input
              value={form.contract_number}
              onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
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
                {investors.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.name}
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
                {insurers.map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.name}
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
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor do Aluguel (R$) *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.rent_amount}
              onChange={(e) => setForm({ ...form, rent_amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
