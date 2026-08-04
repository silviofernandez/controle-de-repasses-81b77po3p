import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Inbox, Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  message,
  icon: Icon = Inbox,
  action,
}: {
  message: string
  icon?: typeof Inbox
  action?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
  )
}

export function InlineSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}
