import openpyxl, re, json, collections, sys
# Usage : python3 scripts/import_excel_parse.py <tracker.xlsx> <sortie.json>
F=sys.argv[1]
wb=openpyxl.load_workbook(F,data_only=True)
norm=lambda s: re.sub(r'\s+',' ',str(s).replace('\xa0',' ')).strip().upper()
# joueurs
plist=[]
for r in wb['List of Players'].iter_rows(min_row=3,values_only=True):
    team,nom,prenom,nj=r[1],r[2],r[3],r[4]
    if team and nj: plist.append(dict(team=norm(team),nom=norm(nom or ''),prenom=norm(prenom or ''),key=norm(nj)))
# matchs
ws=wb['Inputs - Game results']
rows=list(ws.iter_rows(values_only=True))
matches=[];cur=None
for r in rows:
    if isinstance(r[0],str) and r[0].startswith('Match '):
        cur=dict(n=int(r[0].split()[1]),home=norm(r[1]),hs=r[2],away=norm(r[3]),as_=r[4],played=norm(r[10] or ''),ev=[]);matches.append(cur);continue
    if cur and r[1] and r[3] and r[1]!='Team A':
        for side,(t,a,p,n) in (('H',(r[1],r[3],r[4],r[5])),('A',(r[6],r[8],r[9],r[10]))):
            if p: cur['ev'].append(dict(side=side,team=norm(t),action=a,player=norm(p),n=int(n) if isinstance(n,(int,float)) and n else 1))
print('matchs',len(matches),'joueurs',len(plist))
acts=collections.Counter(e['action'] for m in matches for e in m['ev']); print(acts)
print(collections.Counter(m['played'] for m in matches))
keys={(p['team'],p['key']) for p in plist}
unk=collections.Counter((e['team'],e['player']) for m in matches for e in m['ev'] if (e['team'],e['player']) not in keys)
print('inconnus',len(unk),list(unk.items())[:40])
bad=[]
for m in matches:
    for side,team,sc in (('H',m['home'],m['hs']),('A',m['away'],m['as_'])):
        g=sum(e['n'] for e in m['ev'] if e['side']==side and e['action']=='But')
        a=sum(e['n'] for e in m['ev'] if e['side']==side and e['action']=='Passe décisive')
        if sc is not None and (g!=sc or a>sc): bad.append((m['n'],team,sc,g,a))
print('écarts score',len(bad),bad[:30])
json.dump(dict(players=plist,matches=matches),open(sys.argv[2],'w'),ensure_ascii=False)
