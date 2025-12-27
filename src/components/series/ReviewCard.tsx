import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, ThumbsUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ReviewCardProps {
  id: string
  userId: string
  username: string
  avatar: string | null
  content: string
  hasSpoiler: boolean
  createdAt: string | Date
  likes?: number
  className?: string
}

export function ReviewCard({
  id,
  userId,
  username,
  avatar,
  content,
  hasSpoiler,
  createdAt,
  likes,
  className,
}: ReviewCardProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={username}
              className="object-cover"
            />
          ) : (
            <AvatarFallback>
              {username?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${userId}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {username}
              </Link>

              {hasSpoiler && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Spoiler
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>

              {likes && likes > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{likes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-4">
            {hasSpoiler && (
              <div className="mb-3">
                <Badge variant="destructive" className="mb-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Spoiler Warning
                </Badge>
              </div>
            )}

            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <ThumbsUp className="h-4 w-4 mr-2" />
              Helpful
            </Button>
            <Button variant="ghost" size="sm">
              Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
