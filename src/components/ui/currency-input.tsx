import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface CurrencyInputProps {
  value: string | number
  onValueChange: (rawValue: string) => void
  id?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

function formatBR(rawDigits: string): string {
  const cleaned = rawDigits.replace(/^0+/, '') || '0'
  const padded = cleaned.padStart(3, '0')
  const intPart = padded.slice(0, -2)
  const decPart = padded.slice(-2)
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedInt},${decPart}`
}

function stripNonDigits(s: string): string {
  return s.replace(/\D/g, '')
}

export function CurrencyInput({
  value,
  onValueChange,
  id,
  placeholder,
  className,
  disabled,
  required,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState('')
  const displayRef = useRef('')

  useEffect(() => {
    const str = typeof value === 'number' ? value.toString() : value
    if (!str || str === '') {
      setDisplay('')
      displayRef.current = ''
      return
    }
    const num = parseFloat(str)
    if (isNaN(num)) {
      setDisplay('')
      displayRef.current = ''
      return
    }
    const cents = String(Math.round(num * 100))
    const currentDigits = stripNonDigits(displayRef.current)
    const currentCents = currentDigits ? parseInt(currentDigits, 10) : -1
    if (currentCents === parseInt(cents, 10)) return
    const formatted = formatBR(cents)
    setDisplay(formatted)
    displayRef.current = formatted
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = stripNonDigits(e.target.value)
    if (!digits) {
      setDisplay('')
      displayRef.current = ''
      onValueChange('')
      return
    }
    const formatted = formatBR(digits)
    setDisplay(formatted)
    displayRef.current = formatted
    const cents = parseInt(digits, 10)
    onValueChange((cents / 100).toFixed(2))
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={(e) => e.target.select()}
      placeholder={placeholder || '0,00'}
      className={className}
      disabled={disabled}
      required={required}
    />
  )
}
