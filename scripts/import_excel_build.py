import json, re, collections, sys, openpyxl
# Usage : python3 scripts/import_excel_build.py <sortie.json de l'étape 1> <IPG.xlsx> src/api/seed/season2025.data.ts
d=json.load(open(sys.argv[1]))
TEAMS={ # clé: (nom, court, couleur1, couleur2)
 'MONDIAL SERVICES':('Mondial Services','MDS','#B3262E','#2A0A0C'),'DISTRA':('Distra','DST','#8CC63F','#13240A'),
 'DELL':('Dell','DEL','#0076CE','#062645'),'WAFASALAF':('Wafasalaf','WAF','#00A0B0','#04262A'),
 'ATELIER VERT RABAT':('Atelier Vert Rabat','AVR','#4A7729','#0E1A08'),'ARROW ECS':('Arrow ECS','ARW','#D9DDE2','#1A1D21'),
 'CAC':('CAC','CAC','#2E5072','#0A1724'),'CASA VIGILANCE':('Casa Vigilance','CVG','#F5B731','#0F2244'),
 'ALMAV GROUP':('Almav Group','ALM','#E30613','#2A0406'),'COOPER PHARMA':('Cooper Pharma','COP','#00A99D','#0A2A4F'),
 'CHAABI LLD':('Chaabi LLD','CHL','#F26722','#2A1205'),'VIVALIS':('Vivalis','VIV','#1A8DB5','#05202A'),
 'DISWAY':('Disway','DSW','#E8312F','#141414'),'CTR':('CTR','CTR','#3BB54A','#121A55'),
 'MEGA PT':('Mega Post Tension','MPT','#1E90FF','#0A1E33'),'ATELIER VERT CASA':('Atelier Vert Casa','AVC','#4A7729','#0E1A08'),
}
tkeys=list(TEAMS)
def cap(s):
    s=s.strip()
    return ' '.join(w.capitalize() if not re.fullmatch(r"[A-Z]\.?",w) else w for w in re.split(r'\s+',s.lower().title()) ) if s else s
def cap(s):
    out=[]
    for w in re.split(r'\s+',s.strip()):
        if not w: continue
        out.append('-'.join(x[:1].upper()+x[1:].lower() for x in w.split('-')))
    return ' '.join(out)
players=[];pidx={}
for p in d['players']:
    if 'OWN GOAL' in p['key']: continue  # ligne technique du fichier Excel, pas un joueur
    k=(p['team'],p['key']); 
    if k in pidx: continue
    pidx[k]=len(players); players.append(dict(team=p['team'],first=cap(p['prenom']),last=cap(p['nom']),key=p['key']))
def get(team,key):
    if (team,key) in pidx: return pidx[(team,key)]
    m=re.match(r'([A-Z])\.?\s*(.+)',key)
    first,last=(m.group(1)+'.',cap(m.group(2))) if m else ('',cap(key))
    pidx[(team,key)]=len(players); players.append(dict(team=team,first=first,last=last,key=key)); return pidx[(team,key)]
T={'But':'g','Passe décisive':'a','Arrêt':'s','Carton jaune':'y','Carton rouge':'r'}
tot=collections.defaultdict(collections.Counter)
nextr=collections.Counter();out=[]
for m in sorted(d['matches'],key=lambda x:x['n']):
    played=m['played']=='OUI'
    r=max(nextr[m['home']],nextr[m['away']])+1; nextr[m['home']]=nextr[m['away']]=r
    evs=[]
    for e in m['ev']:
        side=0 if e['side']=='H' else 1
        if 'OWN GOAL' in e['player']:
            evs.append([side,'og',-1,e['n']]); continue
        i=get(e['team'],e['player']); t=T[e['action']]
        evs.append([side,t,i,e['n']]); tot[i][t]+=e['n']
    out.append([m['n'],r,tkeys.index(m['home']),tkeys.index(m['away']),m['hs'] if played else None,m['as_'] if played else None,evs])
print('journées',max(x[1] for x in out))
def pos(i):
    c=tot[i]; g,a,s=c['g'],c['a'],c['s']
    # 6 contre 6 : pas de postes, seul le gardien est identifié
    return 'GK' if s>=10 and s>=3*(g+a) else 'FIELD'
P=[[tkeys.index(p['team']),p['first'],p['last'],pos(i)] for i,p in enumerate(players)]
print(collections.Counter(x[3] for x in P), len(P))
# IPG
wb=openpyxl.load_workbook(sys.argv[2],data_only=True)
norm=lambda s: re.sub(r'\s+',' ',str(s).replace('\xa0',' ')).strip().upper()
ipg=[]
for r in list(wb.active.iter_rows(min_row=2,values_only=True)):
    if not r[0]: continue
    team=norm(r[1]); key=norm(r[0])
    cand=[i for i,p in enumerate(players) if p['team']==team and norm(p['key']).replace(' ','')==key.replace(' ','')]
    ipg.append(dict(name=r[0].strip(),team=r[1].strip(),goals=r[2],assists=r[3],contribution=round(r[4],1),win_pct=round(r[5],1),card_penalty=r[6],clutch_goals=r[7],clutch_assists=r[8],clutch_score=r[9],adversity=round(r[10]*100,1),raw=round(r[11],1),ipg=round(r[12],2),player=cand[0] if cand else -1))
ipg.sort(key=lambda x:-x['ipg'])
print('IPG liés',sum(1 for x in ipg if x['player']>=0),'/',len(ipg),[x['name'] for x in ipg if x['player']<0])
ts='// Données réelles — Saison 2025-2026 (MBL_26_Game_stats_tracker_27_03_26.xlsx) et classement IPG Top 25 (IPG_Top25_FINAL_A_REVERIFIER.xlsx).\n// Fichier GÉNÉRÉ — ne pas modifier à la main.\n/* eslint-disable */\n'
ts+='export type S25Event = [side: 0 | 1, type: \'g\' | \'a\' | \'s\' | \'y\' | \'r\' | \'og\', player: number, count: number]\n'
ts+='export type S25Match = [n: number, round: number, home: number, away: number, hs: number | null, as: number | null, events: S25Event[]]\n'
ts+='export const S25_TEAMS: [name: string, short: string, c1: string, c2: string][] = '+json.dumps([list(TEAMS[k]) for k in tkeys],ensure_ascii=False)+'\n'
ts+='export const S25_PLAYERS: [team: number, first: string, last: string, role: \'GK\' | \'FIELD\'][] = '+json.dumps(P,ensure_ascii=False)+'\n'
ts+='export const S25_MATCHES: S25Match[] = '+json.dumps(out,ensure_ascii=False)+'\n'
ts+='export interface IPGRow { name: string; team: string; goals: number; assists: number; contribution: number; win_pct: number; card_penalty: number; clutch_goals: number; clutch_assists: number; clutch_score: number; adversity: number; raw: number; ipg: number; player: number }\n'
ts+='export const IPG_TOP25: IPGRow[] = '+json.dumps(ipg,ensure_ascii=False,indent=0).replace('\n','')+'\n'
open(sys.argv[3],'w').write(ts)
