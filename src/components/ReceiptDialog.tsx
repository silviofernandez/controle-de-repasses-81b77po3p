import { useState, useEffect } from 'react'
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
import { computeRepassValue, computeDefaultReceivedValue } from '@/lib/repass-utils'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: FolderRecord | null
  onSaved?: () => void
}

export function ReceiptDialog({ open, onOpenChange, folder, onSaved }: ReceiptDialogProps) {
  const { toast } = useToast()
  const [receivedAmount, setReceivedAmount] = useState('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open && folder) {
      const defaultVal = computeDefaultReceivedValue(folder)
      setReceivedAmount(defaultVal.toFixed(2))
      setReceiptDate(new Date().toISOString().split('T')[0])
      setSaving(false)
      setValidationError('')
      setFieldErrors({})
    }
  }, [open, folder])

  const repassValue = folder ? computeRepassValue(folder) : 0
  const defaultReceived = repassValue * 1.2
  const parsedAmount = receivedAmount ? parseFloat(receivedAmount) : 0

  const validate = (): boolean => {
    setValidationError('')
    if (!receivedAmount || receivedAmount.trim() === '') {
      setValidationError('Informe o valor recebido.')
      return false
    }
    const num = parseFloat(receivedAmount)
    if (isNaN(num)) {
      setValidationError('Valor inválido.')
      return false
    }
    if (num <= 0) {
      setValidationError('O valor deve ser maior que zero.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folder) return
    if (!validate()) return
    setSaving(true)
    setFieldErrors({})
    try {
      await updateFolder(folder.id, {
        received_amount: parseFloat(receivedAmount),
        actual_receipt_date: receiptDate,
        status: 'recebido',
      })
      toast({
        title: 'Sucesso',
        description: 'Recebimento registrado com sucesso.',
      })
      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      setFieldErrors(extractFieldErrors(err))
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao registrar recebimento.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const hasError = !!validationError || !!fieldErrors.received_amount

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
              min="0.01"
              placeholder="0,00"
              value={receivedAmount}
              onChange={(e) => {
                setReceivedAmount(e.target.value)
                setValidationError('')
              }}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <p className="text-sm text-destructive">
                {validationError || fieldErrors.received_amount}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Valor padrão (repassado + 20%): {formatCurrency(defaultReceived)}. Edite se
              necessário.
            </p>
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
          {parsedAmount > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Repassado</span>
                <span>{formatCurrency(repassValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Padrão Esperado (+20%)</span>
                <span>{formatCurrency(defaultReceived)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Diferença</span>
                <span
                  className={parsedAmount >= defaultReceived ? 'text-green-600' : 'text-red-600'}
                >
                  {formatCurrency(parsedAmount - defaultReceived)}
                </span>
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
