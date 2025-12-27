'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Eye, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChapterCardProps {
  id: string
  seriesSlug: string
  seriesTitle: string
  chapterNumber: number
  title: string
  views?: number
  pageCount?: number
  publishedAt?: string | Date
  isRead?: boolean
  className?: string
}

export function ChapterCard({
  id,
  seriesSlug,
  seriesTitle,
  chapterNumber,
  title,
  views,
  pageCount,
  publishedAt,
  isRead,
  className,
}: ChapterCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Card className={cn('hover:shadow-md transition-all duration-200', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Chapter Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/reader/${seriesSlug}/${chapterNumber}`} className="block">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  Ch. {chapterNumber}
                </Badge>
                {isRead && (
                  <Badge variant="outline" className="text-xs">
                    Read
                  </Badge>
                )}
              </div>

              <h4 className="font-semibold text-base line-clamp-1 hover:text-primary transition-colors">
                {title}
              </h4>

              <p className="text-sm text-muted-foreground line-clamp-1">
                {seriesTitle}
              </p>
            </Link>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {formattedDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
              )}

              {pageCount && pageCount > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{pageCount} pages</span>
                </div>
              )}

              {views && views > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(views)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Read Button */}
          <Link href={`/reader/${seriesSlug}/${chapterNumber}`} className="flex-shrink-0">
            <Button size="sm">
              Read
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
