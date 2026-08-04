import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, AlertCircle, Users, Building2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { getInvestors, createInvestor, type InvestorRecord } from '@/services/investors'
import { getInsurers, createInsurer, type InsurerRecord } from '@/services/insurers'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'

export default function Relationships() {
  const { toast } = useToast()
  const [investors, setInvestors] = useState<InvestorRecord[]>([])
  const [insurers, setInsurers] = useState<InsurerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'investor' | 'insurer'>('investor')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  })

  const loadData = async () => {
    try {
      const [inv, ins] = await Promise.all([getInvestors(), getInsurers()])
      setInvestors(inv)
      setInsurers(ins)
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

  useRealtime('investors', () => loadData())
  useRealtime('insurers', () => loadData())

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (dialogType === 'investor') {
        await createInvestor(form)
      } else {
        await createInsurer({
          name: form.name,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
        })
      }
      toast({ title: 'Sucesso', description: 'Cadastro realizado.' })
      setDialogOpen(false)
      setForm({
        name: '',
        email: '',
        phone: '',
        document: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
      })
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Não foi possível carregar os relacionamentos.</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relacionamentos</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Investidores</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setDialogType('investor')
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Button>
          </CardHeader>
          <CardContent>
            {investors.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum investidor cadastrado.
              </p>
            ) : (
              <div className="space-y-2">
                {investors.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{inv.name}</p>
                      <p className="text-sm text-muted-foreground">{inv.email}</p>
                    </div>
                    <Badge variant="secondary">{inv.document || '-'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Seguradoras</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setDialogType('insurer')
                setDialogOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Nova
            </Button>
          </CardHeader>
          <CardContent>
            {insurers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma seguradora cadastrada.
              </p>
            ) : (
              <div className="space-y-2">
                {insurers.map((ins) => (
                  <div
                    key={ins.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{ins.name}</p>
                      <p className="text-sm text-muted-foreground">{ins.contact_email || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'investor' ? 'Novo Investidor' : 'Nova Seguradora'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            {dialogType === 'investor' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">Documento</Label>
                  <Input
                    id="document"
                    value={form.document}
                    onChange={(e) => setForm({ ...form, document: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contato</Label>
                  <Input
                    id="contact_name"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">E-mail do Contato</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone do Contato</Label>
                  <Input
                    id="contact_phone"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
