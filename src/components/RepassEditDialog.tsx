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
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { updateFolder, type FolderRecord } from '@/services/folders'
import { useToast } from '@/components/ui/use-toast'
import { InlineSpinner } from '@/components/page-states'
import { formatCurrency } from '@/lib/format'
import { computeRepassValue, computeDefaultReceivedValue } from '@/lib/repass-utils'

interface RepassEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: FolderRecord | null
  onSaved?: () => void
}

export function RepassEditDialog({ open, onOpenChange, folder, onSaved }: RepassEditDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [rentAmount, setRentAmount] = useState('')
  const [repassValue, setRepassValue] = useState('')
  const [receivedAmount, setReceivedAmount] = useState('')

  useEffect(() => {
    if (!open || !folder) return
    setRentAmount((folder.rent_amount || 0).toString())
    setRepassValue(computeRepassValue(folder).toString())
    setReceivedAmount(
      folder.received_amount && folder.received_amount > 0
        ? folder.received_amount.toString()
        : computeDefaultReceivedValue(folder).toFixed(2),
    )
  }, [open, folder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folder) return
    setSaving(true)
    try {
      await updateFolder(folder.id, {
        rent_amount: parseFloat(rentAmount) || 0,
        manual_repass_value: parseFloat(repassValue) || 0,
        received_amount: parseFloat(receivedAmount) || 0,
      })
      toast({ title: 'Sucesso', description: 'Valores atualizados com sucesso.' })
      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao atualizar valores.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const defaultReceived = computeDefaultReceivedValue({
    rent_amount: parseFloat(rentAmount) || 0,
    manual_repass_value: parseFloat(repassValue) || 0,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Repasse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rent_amount">Valor do Aluguel (R$)</Label>
            <CurrencyInput id="rent_amount" value={rentAmount} onValueChange={setRentAmount} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repass_value">Valor do Repasse (R$)</Label>
            <CurrencyInput id="repass_value" value={repassValue} onValueChange={setRepassValue} />
            <p className="text-xs text-muted-foreground">
              Padrão: {formatCurrency(parseFloat(rentAmount) || 0)}. Edite se necessário.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="received_amount">Valor Recebido (R$)</Label>
            <CurrencyInput
              id="received_amount"
              value={receivedAmount}
              onValueChange={setReceivedAmount}
            />
            <p className="text-xs text-muted-foreground">
              Padrão (+20%): {formatCurrency(defaultReceived)}. Edite se necessário.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
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
