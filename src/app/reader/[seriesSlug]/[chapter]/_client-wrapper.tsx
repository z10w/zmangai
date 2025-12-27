'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import of reader page to properly handle params
const ReaderPage = dynamic(
  () => import('./_client-reader'),
  { 
    ssr: false,
    loading: () => <div className="flex h-screen items-center justify-center">Loading reader...</div>
  }
)

export default function ReaderWrapper({ 
  params 
}: { 
  params: { seriesSlug: string; chapter: string }
}) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading reader...</div>}>
      <ReaderPage seriesSlug={params.seriesSlug} chapter={params.chapter} />
    </Suspense>
  )
}
