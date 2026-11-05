// CRUD générique piloté par configuration (liste + recherche + formulaire + suppression)
import { useMemo, useState, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import type { EntityMap, EntityName } from '@/types/entities'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterSelect } from '@/components/league/FilterSelect'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export type FieldType = 'text' | 'number' | 'date' | 'datetime' | 'textarea' | 'select' | 'multiselect' | 'color' | 'image' | 'boolean' | 'email' | 'custom'
export interface Field {
  key: string; label: string; type?: FieldType; options?: { value: string; label: string }[]; required?: boolean; help?: string; full?: boolean; placeholder?: string
  /** type 'custom' : rendu libre, reçoit toutes les valeurs du formulaire et peut en modifier plusieurs */
  render?: (value: Record<string, unknown>, patch: (p: Record<string, unknown>) => void) => ReactNode
}
export interface Column<T> { label: string; render: (row: T) => ReactNode; className?: string }

export function EntityForm({ fields, value, onChange }: { fields: Field[]; value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v })
  const patch = (p: Record<string, unknown>) => onChange({ ...value, ...p })
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((f) => {
        const v = value[f.key]
        const id = `f-${f.key}`
        return (
          <div key={f.key} className={cn('space-y-1.5', (f.full || f.type === 'textarea' || f.type === 'multiselect') && 'sm:col-span-2')}>
            <Label htmlFor={id}>{f.label}{f.required && ' *'}</Label>
            {f.type === 'custom' && f.render ? f.render(value, patch) : f.type === 'textarea' ? <Textarea id={id} value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} rows={4} />
              : f.type === 'select' ? <FilterSelect className="sm:w-full" value={(v as string) ?? ''} onChange={(x) => set(f.key, x || undefined)} allLabel="—" options={f.options ?? []} />
                : f.type === 'multiselect' ? <MultiSelect options={f.options ?? []} value={(v as string[]) ?? []} onChange={(x) => set(f.key, x)} />
                  : f.type === 'boolean' ? <div className="flex items-center gap-2 pt-1"><Switch id={id} checked={!!v} onCheckedChange={(c) => set(f.key, c)} /><span className="text-sm text-muted-foreground">{v ? 'Oui' : 'Non'}</span></div>
                    : f.type === 'color' ? <div className="flex gap-2"><input type="color" value={(v as string) ?? '#F85A00'} onChange={(e) => set(f.key, e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-transparent" /><Input id={id} value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} /></div>
                      : f.type === 'image' ? <ImageInput value={v as string} onChange={(x) => set(f.key, x)} />
                        : <Input id={id} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : f.type === 'email' ? 'email' : 'text'} placeholder={f.placeholder}
                          value={f.type === 'datetime' ? ((v as string) ?? '').slice(0, 16) : ((v as string | number) ?? '')}
                          onChange={(e) => set(f.key, f.type === 'number' ? (e.target.value === '' ? undefined : +e.target.value) : e.target.value)} />}
            {f.help && <p className="text-[11px] text-muted-foreground">{f.help}</p>}
          </div>
        )
      })}
    </div>
  )
}

function MultiSelect({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-input bg-night-950/40 p-2">
      {options.map((o) => { const on = value.includes(o.value); return <button type="button" key={o.value} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])} className={cn('rounded-full px-2.5 py-1 text-xs cursor-pointer', on ? 'bg-neon text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10')}>{o.label}</button> })}
    </div>
  )
}

export function ImageInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      {value ? <img src={value} alt="" className="size-12 rounded-lg bg-white/5 object-contain" /> : <div className="size-12 rounded-lg bg-white/5" />}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-xs hover:bg-white/5">
        <Upload className="size-4" />Importer
        <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange((await base44.integrations.Core.UploadFile({ file: f })).file_url) }} />
      </label>
      <Input placeholder="ou URL" value={value?.startsWith('data:') ? '' : value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  )
}

export function EntityCrud<N extends EntityName>({ entity, title, fields, columns, filter, defaults, toolbar, rowActions, sort, searchText, emptyLabel, canDelete = true, transform, prepare, afterSave }: {
  entity: N; title: string; fields: Field[]; columns: Column<EntityMap[N]>[]
  filter?: (r: EntityMap[N]) => boolean; defaults?: () => Record<string, unknown>; toolbar?: ReactNode; rowActions?: (r: EntityMap[N]) => ReactNode
  sort?: (a: EntityMap[N], b: EntityMap[N]) => number; searchText?: (r: EntityMap[N]) => string; emptyLabel?: string; canDelete?: boolean
  transform?: (v: Record<string, unknown>) => Record<string, unknown>
  /** valeurs du formulaire à l'ouverture (champs calculés, ex. « gardien oui/non ») */
  prepare?: (v: Record<string, unknown>) => Record<string, unknown>
  /** après enregistrement (ex. un seul capitaine par équipe) */
  afterSave?: (saved: Record<string, unknown>) => Promise<void> | void
}) {
  const { db } = useData()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const rows = useMemo(() => {
    let r = (db[entity] as EntityMap[N][]).filter((x) => (filter ? filter(x) : true))
    if (q && searchText) r = r.filter((x) => searchText(x).toLowerCase().includes(q.toLowerCase()))
    return sort ? [...r].sort(sort) : r
  }, [db, entity, filter, q, searchText, sort])
  const api = base44.entities[entity] as unknown as { create: (d: unknown) => Promise<unknown>; update: (id: string, d: unknown) => Promise<unknown>; delete: (id: string) => Promise<void> }
  const save = async () => {
    if (!edit) return
    const missing = fields.filter((f) => f.required && (edit[f.key] === undefined || edit[f.key] === ''))
    if (missing.length) { toast.error(`Champ requis : ${missing.map((m) => m.label).join(', ')}`); return }
    const data = transform ? transform(edit) : edit
    const { id, created_date: _c, updated_date: _u, ...rest } = data as Record<string, unknown>
    void _c; void _u
    const saved = id ? { ...rest, id } : ((await api.create(rest)) as Record<string, unknown>)
    if (id) await api.update(id as string, rest)
    await afterSave?.(saved)
    toast.success(id ? 'Modifications enregistrées' : 'Élément créé'); setEdit(null)
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchText && <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 pl-9" /></div>}
        {toolbar}
        <Button className="ml-auto" onClick={() => { const v = { ...(defaults?.() ?? {}) }; setEdit(prepare ? prepare(v) : v) }}><Plus />Ajouter</Button>
      </div>
      <div className="glass rounded-2xl p-1 sm:p-2">
        <Table>
          <TableHeader><TableRow>{columns.map((c) => <TableHead key={c.label} className={c.className}>{c.label}</TableHead>)}<TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                {columns.map((c) => <TableCell key={c.label} className={c.className}>{c.render(r)}</TableCell>)}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {rowActions?.(r)}
                    <Button size="icon" variant="ghost" className="size-8" onClick={() => { const v = { ...(r as unknown as Record<string, unknown>) }; setEdit(prepare ? prepare(v) : v) }} title="Modifier"><Pencil /></Button>
                    {canDelete && (confirm === r.id
                      ? <Button size="sm" variant="destructive" className="h-8" onClick={async () => { await api.delete(r.id); setConfirm(null); toast.success('Supprimé') }}>Confirmer</Button>
                      : <Button size="icon" variant="ghost" className="size-8 text-red-400" onClick={() => setConfirm(r.id)} title="Supprimer"><Trash2 /></Button>)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">{emptyLabel ?? 'Aucun élément'}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{rows.length} élément(s)</p>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? 'Modifier' : 'Ajouter'} · {title}</DialogTitle></DialogHeader>
          {edit && <EntityForm fields={fields} value={edit} onChange={setEdit} />}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
