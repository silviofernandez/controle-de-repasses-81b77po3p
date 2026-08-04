import { FolderOpen, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export default function Folders() {
  return (
    <PagePlaceholder
      title="Pastas"
      description="Gerencie as pastas de repasses de aluguéis garantidos"
      icon={FolderOpen}
      action={
        <Link to="/folders/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Pasta
          </Button>
        </Link>
      }
    />
  )
}
