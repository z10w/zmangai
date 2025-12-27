'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Eye, Heart } from 'lucide-react'

interface SeriesCardProps {
  id: string
  slug: string
  title: string
  coverImage: string
  type: string
  status: string
  rating: number
  views: number
  followers: number
  genres?: Array<{ genre: { name: string; slug: string } }>
  isFollowing?: boolean
}

export function SeriesCard({
  slug,
  title,
  coverImage,
  type,
  status,
  rating,
  views,
  followers,
  genres,
  isFollowing,
}: SeriesCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/series/${slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={coverImage || '/placeholder-cover.jpg'}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge variant="secondary">{type}</Badge>
            <Badge variant={status === 'ONGOING' ? 'default' : 'secondary'}>
              {status}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/series/${slug}`}>
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 3).map((g) => (
              <Badge key={g.genre.slug} variant="outline" className="text-xs">
                {g.genre.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{formatNumber(views)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{formatNumber(followers)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link href={`/series/${slug}`} className="w-full">
          <Button className="w-full" variant={isFollowing ? "outline" : "default"}>
            {isFollowing ? 'Reading' : 'Start Reading'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
