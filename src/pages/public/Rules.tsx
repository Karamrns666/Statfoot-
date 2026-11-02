import ReactMarkdown from 'react-markdown'
import { useData } from '@/hooks/useData'
import { PageHeader } from '@/components/league/Bits'
import { Card, CardContent } from '@/components/ui/card'

export default function Rules() {
  const { db } = useData()
  const page = db.Page.find((p) => p.slug === 'reglement' && p.published !== false)
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={page?.title ?? 'Règlement'} />
      <Card><CardContent className="markdown pt-5"><ReactMarkdown>{page?.content ?? 'Règlement à venir.'}</ReactMarkdown></CardContent></Card>
    </div>
  )
}
