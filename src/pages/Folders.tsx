import { FolderOpen } from 'lucide-react'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export default function Folders() {
  return (
    <PagePlaceholder
      title="Pastas"
      description="Gerencie as pastas de repasses de aluguéis garantidos"
      icon={FolderOpen}
    />
  )
}
