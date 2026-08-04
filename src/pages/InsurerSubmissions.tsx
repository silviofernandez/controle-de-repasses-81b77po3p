import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Send, Printer, Mail, ClipboardCopy, Calendar } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/components/ui/use-toast'
import {
  getTodaysInsurerSubmissions,
  sendInsurerSubmissionEmail,
  generateWhatsAppText,
  generatePrintHtml,
  getTodayFormatted,
} from '@/services/insurer-submissions'
import type { FolderRecord } from '@/services/folders'

export default function InsurerSubmissions() {
  const { toast } = useToast()
  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const loadData = async () => {
    try {
      const data = await getTodaysInsurerSubmissions()
      setFolders(data)
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

  useRealtime('folders', () => loadData())

  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppText(folders)
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: 'Sucesso', description: 'Texto copiado para a área de transferência' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      })
    }
  }

  const handlePrint = () => {
    const html = generatePrintHtml(folders)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      await sendInsurerSubmissionEmail()
      toast({ title: 'Sucesso', description: 'Relatório enviado por e-mail com sucesso.' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar o relatório. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Não foi possível carregar as pastas.</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Envios à Seguradora</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {getTodayFormatted()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyWhatsApp}
            disabled={folders.length === 0}
          >
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copiar para WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={folders.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button
            size="sm"
            onClick={handleSendEmail}
            disabled={folders.length === 0 || sendingEmail}
          >
            <Mail className="mr-2 h-4 w-4" />
            {sendingEmail ? 'Enviando...' : 'Enviar por E-mail'}
          </Button>
        </div>
      </div>

      {folders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Send className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma pasta para envio à seguradora hoje.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nº da Pasta</th>
                    <th className="px-4 py-3 text-left font-medium">Proprietário</th>
                    <th className="px-4 py-3 text-left font-medium">Seguradora</th>
                  </tr>
                </thead>
                <tbody>
                  {folders.map((folder) => (
                    <tr key={folder.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{folder.contract_number}</td>
                      <td className="px-4 py-3">{folder.owner_name || '-'}</td>
                      <td className="px-4 py-3">{folder.expand?.insurer_id?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
