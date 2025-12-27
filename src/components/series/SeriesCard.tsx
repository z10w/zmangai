'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Book, Star, Eye, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SeriesCardProps {
  id: string
  slug: string
  title: string
  coverImage: string
  type: string
  status: string
  views?: number
  followers?: number
  rating?: number
  genres?: Array<{ genre: { name: string } }>
  isMature?: boolean
  isFollowing?: boolean
  className?: string
}

export function SeriesCard({
  id,
  slug,
  title,
  coverImage,
  type,
  status,
  views,
  followers,
  rating,
  genres,
  isMature,
  isFollowing,
  className,
}: SeriesCardProps) {
  return (
    <Card className={cn('group overflow-hidden hover:shadow-lg transition-all duration-300', className)}>
      <Link href={`/series/${slug}`} className="block">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {type}
            </Badge>
            {isMature && (
              <Badge variant="destructive" className="text-xs">
                Mature
              </Badge>
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={status === 'ONGOING' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {status}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <Link href={`/series/${slug}`} className="block">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {/* Genres */}
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 3).map(({ genre }) => (
              <Badge key={genre.name} variant="outline" className="text-xs">
                {genre.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {rating && rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium">{rating.toFixed(1)}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {views && views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{formatNumber(views)}</span>
              </div>
            )}

            {followers && followers > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{formatNumber(followers)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link href={`/series/${slug}`} className="w-full">
          <Button className="w-full" variant={isFollowing ? 'outline' : 'default'}>
            {isFollowing ? (
              <>
                <Heart className="mr-2 h-4 w-4 fill-current" />
                Following
              </>
            ) : (
              <>
                <Book className="mr-2 h-4 w-4" />
                Read Now
              </>
            )}
          </Button>
        </Link>
      </CardFooter>
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
