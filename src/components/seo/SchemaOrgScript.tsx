'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function SchemaOrgScript() {
  const pathname = usePathname()

  // Only generate schema.org for series pages
  const isSeriesPage = pathname.match(/^\/series\/[^/]+$/)

  useEffect(() => {
    if (isSeriesPage && typeof window !== 'undefined') {
      // Fetch schema.org data
      fetch('/api/schema/series')
        .then((res) => res.json())
        .then((data) => {
          if (data.schema) {
            // Create or update JSON-LD script tag
            const scriptTag = document.getElementById('schema-org-jsonld')
            if (scriptTag) {
              scriptTag.textContent = JSON.stringify(data.schema)
            } else {
              const script = document.createElement('script')
              script.id = 'schema-org-jsonld'
              script.type = 'application/ld+json'
              script.textContent = JSON.stringify(data.schema)
              document.head.appendChild(script)
            }
          }
        })
        .catch((err) => {
          console.error('Error fetching schema.org:', err)
        })
    }
  }, [pathname, isSeriesPage])

  if (!isSeriesPage) {
    return null
  }

  return <script id="schema-org-jsonld" type="application/ld+json" />
}
