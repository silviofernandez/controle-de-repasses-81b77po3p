import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Save } from 'lucide-react'
import { getSettings, updateSetting, createSetting, type SettingRecord } from '@/services/settings'
import { useToast } from '@/components/ui/use-toast'

export default function Settings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SettingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
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

  const handleValueChange = (id: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)))
  }

  const handleSave = async (setting: SettingRecord) => {
    setSaving(true)
    try {
      await updateSetting(setting.id, { value: setting.value })
      toast({ title: 'Sucesso', description: 'Configuração salva.' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Não foi possível carregar as configurações.</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma configuração disponível.
            </p>
          ) : (
            settings.map((setting) => (
              <div key={setting.id} className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={setting.id}>{setting.description || setting.key}</Label>
                  <Input
                    id={setting.id}
                    value={setting.value}
                    onChange={(e) => handleValueChange(setting.id, e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={() => handleSave(setting)} disabled={saving}>
                  <Save className="mr-1 h-4 w-4" /> Salvar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
