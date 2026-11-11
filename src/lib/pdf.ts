// Exports PDF (jsPDF) : classements. La feuille de match utilise l'impression navigateur (mise en page A4 dédiée).
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { StandingRow } from './standings'

export function exportStandingsPdf(title: string, subtitle: string, rows: StandingRow[], teamName: (id: string) => string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setFillColor(11, 20, 38); doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(242, 107, 29); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text(title.toUpperCase(), 14, 14)
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(subtitle, 14, 21)
  autoTable(doc, {
    startY: 34,
    head: [['Pos', 'Équipe', 'MJ', 'V', 'N', 'D', 'BP', 'BC', 'DIFF', 'PTS', 'Forme']],
    body: rows.map((r) => [r.rank, teamName(r.team_id), r.played, r.won, r.drawn, r.lost, r.gf, r.ga, r.gd > 0 ? `+${r.gd}` : r.gd, r.points, r.form.map((f) => (f === 'W' ? 'V' : f === 'D' ? 'N' : 'D')).join(' ')]),
    headStyles: { fillColor: [242, 107, 29], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: { 1: { cellWidth: 55 }, 9: { fontStyle: 'bold' } },
  })
  doc.setFontSize(8); doc.setTextColor(120); doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 290)
  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

/** PV (Art. 17.7) en PDF A4 : en-tête de la ligue, texte du PV (sans la mise en forme WhatsApp). */
export function exportPvPdf(number: string, title: string, text: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  // les polices standard de jsPDF ne couvrent que le Latin-1 : on remplace la typographie hors jeu
  const safe = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, '-').replace(/…/g, '...').replace(/[  ]/g, ' ').replace(/·/g, '-')
  doc.setFillColor(11, 20, 38); doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(242, 107, 29); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('PROCES-VERBAL', 14, 14)
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(safe(`${number} - ${title}`), 14, 22)
  let y = 42
  for (const raw of safe(text).split('\n')) {
    const bold = /^\*.*\*$/.test(raw.trim()) || /^\*[^*]+\*\s?:/.test(raw)
    const line = raw.replace(/\*([^*\n]+)\*/g, '$1')
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(bold && /^\*[^:]+\*$/.test(raw.trim()) ? 12 : 10.5); doc.setTextColor(20)
    const wrapped: string[] = line ? doc.splitTextToSize(line, 182) : ['']
    for (const w of wrapped) { if (y > 280) { doc.addPage(); y = 20 } doc.text(w, 14, y); y += line ? 5.6 : 3.5 }
  }
  doc.setFontSize(8); doc.setTextColor(120); doc.setFont('helvetica', 'normal'); doc.text(safe(`Ardentia Football - généré le ${new Date().toLocaleString('fr-FR')}`), 14, 290)
  doc.save(`${number.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
