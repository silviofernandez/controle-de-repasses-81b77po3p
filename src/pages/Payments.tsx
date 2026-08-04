import { CalendarClock } from 'lucide-react'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export default function Payments() {
  return (
    <PagePlaceholder
      title="Próximos Pagamentos"
      description="Acompanhe os pagamentos previstos para os seus repasses"
      icon={CalendarClock}
    />
  )
}
