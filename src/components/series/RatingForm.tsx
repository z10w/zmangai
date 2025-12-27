'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Filter,
  SortDesc,
} from 'lucide-react'

interface RatingFormProps {
  seriesId: string
  seriesTitle: string
  currentRating?: number
  onRatingChange: (rating: number) => void
}

export function RatingForm({ seriesId, seriesTitle, currentRating, onRatingChange }: RatingFormProps) {
  const [rating, setRating] = useState(currentRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId,
          rating,
        }),
      })

      if (response.ok) {
        onRatingChange(rating)
        alert('Rating submitted successfully!')
      } else {
        throw new Error('Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async () => {
    if (!currentRating) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/ratings?seriesId=${seriesId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRating(0)
        onRatingChange(0)
        alert('Rating removed successfully!')
      } else {
        throw new Error('Failed to remove rating')
      }
    } catch (error) {
      console.error('Error removing rating:', error)
      alert('Failed to remove rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold mb-1">Rate this Series</h3>
          <p className="text-sm text-muted-foreground">
            {seriesTitle}
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`h-8 w-8 ${
                  (rating >= value) || (hoverRating >= value)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'fill-transparent text-muted-foreground'
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        {/* Rating Label */}
        <div className="text-center">
          {rating > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              <span className="text-xl font-bold text-yellow-500">
                {rating}
              </span>
              <span className="text-muted-foreground">out of 5</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hoverRating > 0
                ? 'Click to rate'
                : 'Select a rating'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>

          {currentRating && currentRating > 0 && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              <Filter className="mr-2 h-4 w-4" />
              Remove Rating
            </Button>
          )}

          <Button variant="ghost" size="icon">
            <Flag className="h-5 w-5" />
          </Button>
        </div>

        {/* Rating Guidelines */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <SortDesc className="h-4 w-4" />
            Rating Guidelines
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be fair and objective in your rating</li>
            <li>• Only rate series you have read or are currently reading</li>
            <li>• Consider the overall quality, writing, art, and enjoyment</li>
            <li>• Avoid rating based on a single chapter or personal bias</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
