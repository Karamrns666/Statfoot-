import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function FilterSelect({ value, onChange, options, placeholder, allLabel = 'Tous', className, label }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; allLabel?: string | null; className?: string; label?: string
}) {
  return (
    <Select value={value || 'all'} onValueChange={(v) => onChange(v === 'all' ? '' : v)}>
      <SelectTrigger className={cn('h-9 w-full sm:w-44 text-xs', className)} aria-label={label ?? placeholder}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {allLabel !== null && <SelectItem value="all">{allLabel}</SelectItem>}
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
