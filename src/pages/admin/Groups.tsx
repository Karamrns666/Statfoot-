// Groupes (création, affectation, équipes sans groupe, export PDF) + tirage au sort par pots (format « groupes »).
import { useRef, useState } from 'react'
import { FileDown, ImageDown, Lock, Plus, RotateCcw, Shuffle, Trash2, CheckCheck } from 'lucide-react'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { useAuth } from '@/hooks/useAuth'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterSelect } from '@/components/league/FilterSelect'
import { TeamLogo } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import { drawOne, groupsFromPicks } from '@/lib/draw'
import type { Draw } from '@/types/entities'

export default function Groups() {
  const { db } = useData()
  const { seasonId, competitionId } = useAdminScope()
  const comps = db.Competition.filter((c) => c.season_id === seasonId)
  const [cid, setCid] = useState(competitionId || comps.find((c) => c.phase === 'groups')?.id || comps[0]?.id || '')
  return (
    <AdminPage title="Groupes & tirage au sort" subtitle="Pour les formats « groupes + éliminatoires »"
      actions={<FilterSelect value={cid} onChange={(v) => v && setCid(v)} allLabel={null} options={comps.map((c) => ({ value: c.id, label: c.name }))} />}>
      <Tabs defaultValue="groups">
        <TabsList><TabsTrigger value="groups">Groupes</TabsTrigger><TabsTrigger value="draw">Tirage au sort (pots)</TabsTrigger></TabsList>
        <TabsContent value="groups">{cid && <GroupsEditor competitionId={cid} />}</TabsContent>
        <TabsContent value="draw">{cid && <GroupDraw competitionId={cid} />}</TabsContent>
      </Tabs>
    </AdminPage>
  )
}

function GroupsEditor({ competitionId }: { competitionId: string }) {
  const { db } = useData()
  const L = useLookup()
  const comp = L.competition.get(competitionId)!
  const groups = db.Group.filter((g) => g.competition_id === competitionId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const assigned = new Set(groups.flatMap((g) => g.team_ids ?? []))
  const pool = (comp.team_ids?.length ? comp.team_ids : db.Team.map((t) => t.id)).filter((t) => !assigned.has(t))
  const [name, setName] = useState('')
  const assign = async (teamId: string, groupId: string) => {
    for (const g of groups) if (g.team_ids?.includes(teamId)) await base44.entities.Group.update(g.id, { team_ids: g.team_ids.filter((t) => t !== teamId) })
    if (groupId) { const g = groups.find((x) => x.id === groupId)!; await base44.entities.Group.update(g.id, { team_ids: [...(g.team_ids ?? []), teamId] }) }
  }
  const pdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.text(`Groupes — ${comp.name}`, 14, 16)
    let y = 24
    for (const g of groups) { autoTable(doc, { startY: y, head: [[g.name]], body: (g.team_ids ?? []).map((t) => [L.team.get(t)?.name ?? t]), headStyles: { fillColor: [242, 107, 29] } }); y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6 }
    doc.save(`groupes-${comp.name}.pdf`)
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input className="h-9 w-48" placeholder="Groupe A" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={async () => { await base44.entities.Group.create({ competition_id: competitionId, name: name || `Groupe ${String.fromCharCode(65 + groups.length)}`, team_ids: [], order: groups.length }); setName('') }}><Plus />Créer un groupe</Button>
        <Button variant="outline" onClick={pdf} disabled={!groups.length}><FileDown />Export PDF</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <Card key={g.id}><CardHeader className="flex-row items-center justify-between"><CardTitle>{g.name}</CardTitle><button className="text-red-400" onClick={() => base44.entities.Group.delete(g.id)} title="Supprimer"><Trash2 className="size-4" /></button></CardHeader>
            <CardContent className="space-y-1">{(g.team_ids ?? []).map((t) => <div key={t} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1 text-sm"><TeamLogo team={L.team.get(t)} size={18} /><span className="flex-1 truncate">{L.team.get(t)?.name}</span><button className="text-xs text-muted-foreground hover:text-red-400" onClick={() => assign(t, '')}>✕</button></div>)}</CardContent>
          </Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Équipes sans groupe <Badge variant="warning">{pool.length}</Badge></CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {pool.map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-sm"><TeamLogo team={L.team.get(t)} size={18} />{L.team.get(t)?.short_name}
              <select className="rounded bg-night-950 text-xs" value="" onChange={(e) => assign(t, e.target.value)} aria-label="Affecter"><option value="">→</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
            </div>
          ))}
          {!pool.length && <span className="text-sm text-muted-foreground">Toutes les équipes sont affectées.</span>}
        </CardContent>
      </Card>
    </div>
  )
}

function GroupDraw({ competitionId }: { competitionId: string }) {
  const { db } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const comp = L.competition.get(competitionId)!
  const groups = db.Group.filter((g) => g.competition_id === competitionId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const draw = db.Draw.filter((d) => d.competition_id === competitionId && d.type === 'groups' && d.status !== 'draft').sort((a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? ''))[0]
  const visual = useRef<HTMLDivElement>(null)
  const teams = comp.team_ids?.length ? comp.team_ids : db.Team.map((t) => t.id)
  const nPots = 4
  const size = Math.ceil(teams.length / nPots)
  const [pots, setPots] = useState<string[][]>(() => Array.from({ length: nPots }, (_, i) => teams.slice(i * size, (i + 1) * size)))
  const [spinning, setSpinning] = useState<string | null>(null)
  const start = async () => {
    if (groups.length < 2) { toast.error('Créez au moins 2 groupes'); return }
    await base44.entities.Draw.create({ season_id: comp.season_id, competition_id: competitionId, type: 'groups', pots: pots.map((t, i) => ({ pot: i + 1, team_ids: t })), picks: [], status: 'revealing', locked: true, one_team_per_pot_per_group: true, performed_by: user?.email } as Partial<Draw> as Draw)
  }
  const next = async () => {
    if (!draw) return
    const pick = drawOne(draw, groups.map((g) => g.id))
    if (!pick) return
    setSpinning(pick.team_id)
    await new Promise((r) => setTimeout(r, 700))
    setSpinning(null)
    await base44.entities.Draw.update(draw.id, { picks: [...(draw.picks ?? []), pick] })
  }
  const apply = async () => {
    if (!draw) return
    const res = groupsFromPicks(draw.picks ?? [])
    for (const g of groups) await base44.entities.Group.update(g.id, { team_ids: res.get(g.id) ?? [] })
    await base44.entities.Draw.update(draw.id, { status: 'published', groups: groups.map((g) => ({ group_id: g.id, name: g.name, team_ids: res.get(g.id) ?? [] })) })
    toast.success('Résultats appliqués aux groupes')
  }
  const total = draw?.pots?.reduce((a, p) => a + p.team_ids.length, 0) ?? 0
  const done = (draw?.picks?.length ?? 0) >= total && total > 0
  const res = groupsFromPicks(draw?.picks ?? [])
  return (
    <div className="space-y-4">
      {!draw ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            {pots.map((p, i) => (
              <Card key={i}><CardHeader><CardTitle>Pot {i + 1}{i === 0 && <span className="ml-2 text-xs text-muted-foreground">têtes de série</span>}</CardTitle></CardHeader>
                <CardContent className="space-y-1">{p.map((t) => <div key={t} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1 text-sm"><TeamLogo team={L.team.get(t)} size={18} /><span className="flex-1 truncate">{L.team.get(t)?.name}</span>
                  <select className="rounded bg-night-950 text-xs" value={i} onChange={(e) => setPots(pots.map((x, j) => (j === +e.target.value ? [...x.filter((y) => y !== t), t] : x.filter((y) => y !== t))))} aria-label="Pot">{pots.map((_, j) => <option key={j} value={j}>Pot {j + 1}</option>)}</select></div>)}</CardContent></Card>
            ))}
          </div>
          <Button onClick={start}><Shuffle />Lancer le tirage (pots verrouillés)</Button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning"><Lock className="size-3" />Pots verrouillés</Badge>
            {!done && draw.status !== 'published' && <Button onClick={next} disabled={!!spinning}><Shuffle />Tirer la prochaine équipe</Button>}
            <Button variant="outline" onClick={async () => { if (visual.current) { const a = document.createElement('a'); a.href = await toPng(visual.current, { pixelRatio: 2 }); a.download = 'tirage.png'; a.click() } }}><ImageDown />Exporter le visuel</Button>
            {done && draw.status !== 'published' && <Button onClick={apply}><CheckCheck />Voir les résultats → appliquer aux groupes</Button>}
            <Button variant="ghost" onClick={async () => { await base44.entities.Draw.update(draw.id, { status: 'draft' }); toast.info('Tirage réinitialisé') }}><RotateCcw />Recommencer</Button>
          </div>
          {spinning && <div className="glass flex items-center justify-center gap-3 rounded-2xl p-6 animate-pulse"><TeamLogo team={L.team.get(spinning)} size={56} /><span className="title-caps text-3xl">{L.team.get(spinning)?.name}</span></div>}
          <div ref={visual} className="grid gap-3 rounded-2xl bg-night-900 p-4 md:grid-cols-4">
            <div className="title-caps md:col-span-4 text-2xl">Tirage — {comp.name}</div>
            {groups.map((g) => (
              <div key={g.id} className="glass rounded-xl p-3"><div className="title-caps mb-2 text-neon">{g.name}</div>
                {(res.get(g.id) ?? []).map((t) => <div key={t} className="flex animate-[fadein_.5s_ease] items-center gap-2 py-1 text-sm"><TeamLogo team={L.team.get(t)} size={20} />{L.team.get(t)?.name}</div>)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
