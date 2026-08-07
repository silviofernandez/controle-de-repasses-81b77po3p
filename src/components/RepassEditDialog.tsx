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
import { updateFolder, type FolderRecord } from '@/services/folders'
import { useToast } from '@/components/ui/use-toast'
import { InlineSpinner } from '@/components/page-states'
import { formatCurrency } from '@/lib/format'
import { computeRepassValue } from '@/lib/repass-utils'

interface RepassEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: FolderRecord | null
  onSaved?: () => void
}

export function RepassEditDialog({ open, onOpenChange, folder, onSaved }: RepassEditDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [repassedDate, setRepassedDate] = useState('')
  const [punctualityDiscount, setPunctualityDiscount] = useState('')
  const [manualRepassValue, setManualRepassValue] = useState('')

  useEffect(() => {
    if (!open || !folder) return
    setRepassedDate(folder.repassed_date ? folder.repassed_date.split(' ')[0] : '')
    setPunctualityDiscount(
      folder.punctuality_discount ? folder.punctuality_discount.toString() : '0',
    )
    const calculated = computeRepassValue(folder)
    setManualRepassValue(
      folder.manual_repass_value && folder.manual_repass_value > 0
        ? folder.manual_repass_value.toString()
        : calculated.toFixed(2),
    )
  }, [open, folder])

  const rentAmount = folder?.rent_amount || 0
  const discount = punctualityDiscount ? parseFloat(punctualityDiscount) || 0 : 0
  const adminFee = rentAmount * 0.1
  const calculatedRepassValue = rentAmount - discount - adminFee
  const repassValue = manualRepassValue
    ? parseFloat(manualRepassValue) || calculatedRepassValue
    : calculatedRepassValue

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folder) return
    setSaving(true)
    try {
      const manualValue = parseFloat(manualRepassValue) || 0
      await updateFolder(folder.id, {
        repassed_date: repassedDate || null,
        punctuality_discount: discount,
        manual_repass_value: manualValue,
      })
      toast({ title: 'Sucesso', description: 'Repasse atualizado com sucesso.' })
      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao atualizar repasse.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Repasse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repassed_date">Data do Repasse</Label>
            <Input
              id="repassed_date"
              type="date"
              value={repassedDate}
              onChange={(e) => setRepassedDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="punctuality_discount">Desconto de Pontualidade (R$)</Label>
            <Input
              id="punctuality_discount"
              type="number"
              step="0.01"
              min="0"
              value={punctualityDiscount}
              onChange={(e) => setPunctualityDiscount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual_repass_value">Valor do Repasse (R$)</Label>
            <Input
              id="manual_repass_value"
              type="number"
              step="0.01"
              min="0"
              value={manualRepassValue}
              onChange={(e) => setManualRepassValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Valor calculado: {formatCurrency(calculatedRepassValue)}. Edite se necessário.
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor do Aluguel</span>
              <span>{formatCurrency(rentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto de Pontualidade</span>
              <span className="text-red-600">- {formatCurrency(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de Administração (10%)</span>
              <span className="text-red-600">- {formatCurrency(adminFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-medium">
              <span>Valor do Repasse</span>
              <span className="text-green-600">{formatCurrency(repassValue)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
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
