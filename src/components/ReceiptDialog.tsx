import { useState } from 'react'
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
import { updateFolder } from '@/services/folders'
import { useToast } from '@/components/ui/use-toast'
import { InlineSpinner } from '@/components/page-states'
import { formatCurrency } from '@/lib/format'

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: string
  rentAmount: number
  onSaved?: () => void
}

export function ReceiptDialog({
  open,
  onOpenChange,
  folderId,
  rentAmount,
  onSaved,
}: ReceiptDialogProps) {
  const { toast } = useToast()
  const [receivedAmount, setReceivedAmount] = useState('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const surcharge = receivedAmount ? parseFloat(receivedAmount) - rentAmount : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateFolder(folderId, {
        received_amount: parseFloat(receivedAmount) || 0,
        actual_receipt_date: receiptDate,
      })
      toast({
        title: 'Sucesso',
        description: 'Recebimento registrado com sucesso.',
      })
      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao registrar recebimento.',
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
          <DialogTitle>Registrar Recebimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="received_amount">Valor Recebido (R$)</Label>
            <Input
              id="received_amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt_date">Data do Recebimento</Label>
            <Input
              id="receipt_date"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
            />
          </div>
          {receivedAmount && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor do Aluguel</span>
                <span>{formatCurrency(rentAmount)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Acréscimo (Sobretaxa)</span>
                <span>{formatCurrency(surcharge)}</span>
              </div>
            </div>
          )}
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
                'Confirmar Recebimento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
