import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, Settings as SettingsIcon } from 'lucide-react'
import { getSettings, updateSetting, type SettingRecord } from '@/services/settings'
import { useToast } from '@/components/ui/use-toast'
import { LoadingRows, ErrorState, EmptyState, InlineSpinner } from '@/components/page-states'

export default function Settings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SettingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
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
        <Card>
          <CardContent className="space-y-4">
            <LoadingRows count={3} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <ErrorState message="Não foi possível carregar as configurações." onRetry={loadData} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {settings.length === 0 ? (
        <EmptyState message="Nenhuma configuração encontrada." icon={SettingsIcon} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((setting) => (
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
                  {saving ? (
                    <>
                      <InlineSpinner className="mr-1" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 h-4 w-4" /> Salvar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
