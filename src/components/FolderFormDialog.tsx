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
import { Link } from 'react-router-dom'
import { ExternalLink, AlertCircle } from 'lucide-react'

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

const emptyForm = {
  contract_number: '',
  owner_name: '',
  insurer_id: '',
  owner_transfer_date: '',
  investor_share_amount: '',
  punctuality_discount: '',
  status: 'repassado' as FolderStatus,
  notes: '',
}

export function FolderFormDialog({ open, onOpenChange, folder, onSaved }: FolderFormDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [investor, setInvestor] = useState<InvestorRecord | null>(null)
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingDeps, setLoadingDeps] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const isEditing = !!folder

  useEffect(() => {
    if (!open) return
    loadDependencies()
    if (folder) {
      setForm({
        ...emptyForm,
        contract_number: folder.contract_number || '',
        owner_name: folder.owner_name || '',
        insurer_id: folder.insurer_id || '',
        owner_transfer_date: folder.owner_transfer_date
          ? folder.owner_transfer_date.split(' ')[0]
          : '',
        investor_share_amount: folder.investor_share_amount?.toString() || '',
        punctuality_discount: folder.punctuality_discount?.toString() || '',
        status: folder.status || 'pendente',
        notes: folder.notes || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, folder])

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

    const shareAmount = form.investor_share_amount ? parseFloat(form.investor_share_amount) : 0
    const punctualityDiscount = form.punctuality_discount
      ? parseFloat(form.punctuality_discount)
      : 0

    const data: Record<string, any> = {
      contract_number: form.contract_number,
      owner_name: form.owner_name,
      investor_id: investor?.id || folder?.investor_id,
      insurer_id: form.insurer_id || null,
      initial_date: form.owner_transfer_date || null,
      owner_transfer_date: form.owner_transfer_date || null,
      investor_share_amount: shareAmount,
      rent_amount: shareAmount,
      punctuality_discount: punctualityDiscount,
      status: isEditing ? form.status : 'repassado',
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

          <div className="space-y-2">
            <Label>Seguradora</Label>
            <Select
              value={form.insurer_id}
              onValueChange={(v) => setForm({ ...form, insurer_id: v })}
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
              <ExternalLink className="h-3 w-3" />
              Gerenciar seguradoras
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_transfer_date">Data do Repasse para o Proprietário</Label>
              <Input
                id="owner_transfer_date"
                type="date"
                value={form.owner_transfer_date}
                onChange={(e) => setForm({ ...form, owner_transfer_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investor_share_amount">Valor do Repasse (R$)</Label>
              <Input
                id="investor_share_amount"
                type="number"
                step="0.01"
                value={form.investor_share_amount}
                onChange={(e) => setForm({ ...form, investor_share_amount: e.target.value })}
                required
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label>Desconto de Pontualidade (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.punctuality_discount}
                onChange={(e) => setForm({ ...form, punctuality_discount: e.target.value })}
                placeholder="0,00"
              />
            </div>
          )}

          {isEditing && (
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
          )}

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
            <Button type="submit" disabled={saving || noInvestor}>
              {saving ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Salvando...
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
