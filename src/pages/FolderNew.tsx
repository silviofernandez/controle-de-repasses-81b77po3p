import { useState } from 'react'
import { FolderFormDialog } from '@/components/FolderFormDialog'
import { useNavigate } from 'react-router-dom'

export default function FolderNew() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  return (
    <FolderFormDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) navigate('/folders')
      }}
      onSaved={() => navigate('/folders')}
    />
  )
}
