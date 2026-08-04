import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Building2, Plus } from 'lucide-react'
import { getInsurers, createInsurer, type InsurerRecord } from '@/services/insurers'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { LoadingRows, ErrorState, EmptyState, InlineSpinner } from '@/components/page-states'

export default function Insurers() {
  const { toast } = useToast()
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getInsurers()
      setInsurers(data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('insurers', () => loadData())

  const openDialog = () => {
    setFieldErrors({})
    setForm({ name: '', contact_name: '', contact_email: '', contact_phone: '' })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})
    try {
      await createInsurer(form)
      toast({ title: 'Sucesso', description: 'Seguradora cadastrada com sucesso.' })
      setDialogOpen(false)
    } catch (err) {
      const errors = extractFieldErrors(err)
      setFieldErrors(errors)
      if (Object.keys(errors).length === 0) {
        toast({
          title: 'Erro',
          description: 'Falha ao cadastrar seguradora.',
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardContent className="p-0">
            <LoadingRows count={5} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Seguradoras</h1>
        <ErrorState message="Não foi possível carregar as seguradoras." onRetry={loadData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seguradoras</h1>
        <Button size="sm" onClick={openDialog}>
          <Plus className="mr-1 h-4 w-4" /> Nova Seguradora
        </Button>
      </div>

      {insurers.length === 0 ? (
        <EmptyState
          message="Nenhuma seguradora cadastrada ainda."
          icon={Building2}
          action={
            <Button size="sm" onClick={openDialog}>
              <Plus className="mr-1 h-4 w-4" /> Cadastrar Seguradora
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nome</th>
                    <th className="px-4 py-3 text-left font-medium">Contato</th>
                    <th className="px-4 py-3 text-left font-medium">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium">Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {insurers.map((ins) => (
                    <tr key={ins.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{ins.name}</td>
                      <td className="px-4 py-3">{ins.contact_name || '-'}</td>
                      <td className="px-4 py-3">{ins.contact_email || '-'}</td>
                      <td className="px-4 py-3">{ins.contact_phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Seguradora</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insurer-name">Nome *</Label>
              <Input
                id="insurer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurer-contact-name">Contato</Label>
              <Input
                id="insurer-contact-name"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurer-contact-email">E-mail do Contato</Label>
              <Input
                id="insurer-contact-email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
              {fieldErrors.contact_email && (
                <p className="text-sm text-destructive">{fieldErrors.contact_email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurer-contact-phone">Telefone do Contato</Label>
              <Input
                id="insurer-contact-phone"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
    </div>
  )
}
