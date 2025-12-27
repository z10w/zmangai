import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, User, Calendar, SortDesc } from 'lucide-react'

interface RatingsListProps {
  seriesId: string
  seriesTitle: string
  ratings?: Array<{
    id: string
    userId: string
    username: string
    avatar: string | null
    rating: number
    createdAt: string | Date
  }>
  onRatingUpdated?: () => void
  className?: string
}

export function RatingsList({
  seriesId,
  seriesTitle,
  ratings = [],
  onRatingUpdated,
  className,
}: RatingsListProps) {
  // Calculate rating distribution
  const ratingDistribution = {
    5: ratings.filter((r) => r.rating === 5).length,
    4: ratings.filter((r) => r.rating === 4).length,
    3: ratings.filter((r) => r.rating === 3).length,
    2: ratings.filter((r) => r.rating === 2).length,
    1: ratings.filter((r) => r.rating === 1).length,
  }

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0

  return (
    <div className={className}>
      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span>Ratings Overview</span>
            </div>
            <Button variant="outline" size="sm">
              <SortDesc className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Average Rating</p>
              <div className="text-4xl font-bold text-primary">
                {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
              </div>
            </div>

            {/* Total Ratings */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Ratings</p>
              <div className="text-4xl font-bold">
                {ratings.length}
              </div>
            </div>

            {/* Rating Distribution */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Rating Distribution</p>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((value) => (
                  <div key={value} className="flex items-center gap-3">
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${(ratingDistribution[value as keyof typeof ratingDistribution] / ratings.length) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium w-4">{value}★</span>
                      <span className="text-sm text-muted-foreground">
                        ({ratingDistribution[value as keyof typeof ratingDistribution]})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratings List */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Ratings ({ratings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ratings yet</h3>
              <p className="text-muted-foreground">
                Be the first to rate {seriesTitle}
              </p>
              <Button onClick={onRatingUpdated}>Add Rating</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => {
                const formattedDate = new Date(rating.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div
                    key={rating.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {rating.avatar ? (
                        <img
                          src={rating.avatar}
                          alt={rating.username}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback>
                          {rating.username?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{rating.username}</span>
                          <Badge variant="outline" className="text-xs">
                            Rated {new Date(rating.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold">{rating.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
