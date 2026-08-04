import { Settings as SettingsIcon } from 'lucide-react'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export default function Settings() {
  return (
    <PagePlaceholder
      title="Configurações"
      description="Gerencie as configurações do sistema"
      icon={SettingsIcon}
    />
  )
}
