import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InvestorRecord } from '@/services/investors'

interface InvestorComboboxProps {
  investorId: string
  isNewInvestor: boolean
  newInvestorName: string
  investors: InvestorRecord[]
  loading: boolean
  onChange: (investorId: string, isNew: boolean, name: string) => void
}

export function InvestorCombobox({
  investorId,
  isNewInvestor,
  newInvestorName,
  investors,
  loading,
  onChange,
}: InvestorComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedInvestor = investors.find((i) => i.id === investorId)
  const displayName = isNewInvestor ? newInvestorName : selectedInvestor?.name || ''

  const trimmedSearch = search.trim().toLowerCase()
  const exactMatch = investors.some((i) => i.name.toLowerCase() === trimmedSearch)
  const showCreateOption = trimmedSearch.length > 0 && !exactMatch
  const filtered = investors.filter((i) => i.name.toLowerCase().includes(trimmedSearch))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Carregando investidores...</span>
            </>
          ) : (
            <>
              {displayName || (
                <span className="text-muted-foreground">
                  Selecione ou digite o nome do investidor...
                </span>
              )}
            </>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar ou digitar nome do investidor..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {showCreateOption && (
              <CommandGroup heading="Criar novo">
                <CommandItem
                  onSelect={() => {
                    onChange('', true, search.trim())
                    setSearch('')
                    setOpen(false)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar investidor: {search.trim()}
                </CommandItem>
              </CommandGroup>
            )}
            {filtered.length > 0 && (
              <CommandGroup heading="Investidores">
                {filtered.map((investor) => (
                  <CommandItem
                    key={investor.id}
                    value={investor.name}
                    onSelect={() => {
                      onChange(investor.id, false, investor.name)
                      setSearch('')
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !isNewInvestor && investorId === investor.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {investor.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!showCreateOption && filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum investidor encontrado.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
