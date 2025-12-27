'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ThumbsUp,
  Reply,
  MoreHorizontal,
  Flag,
  Trash2,
  AlertTriangle,
  User,
} from 'lucide-react'
import Link from 'next/link'

interface CommentProps {
  id: string
  userId: string
  username: string
  avatar: string | null
  content: string
  hasSpoiler: boolean
  isDeleted: boolean
  isLiked: boolean
  likesCount: number
  repliesCount: number
  createdAt: string | Date
  showReplies?: boolean
  onReplyClick?: () => void
  onLikeClick?: () => void
  onDeleteClick?: () => void
  level?: number
  className?: string
}

export function Comment({
  id,
  userId,
  username,
  avatar,
  content,
  hasSpoiler,
  isDeleted,
  isLiked,
  likesCount,
  repliesCount,
  createdAt,
  showReplies = false,
  onReplyClick,
  onLikeClick,
  onDeleteClick,
  level = 0,
  className,
}: CommentProps) {
  const [showSpoiler, setShowSpoiler] = useState(hasSpoiler)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleLike = async () => {
    if (onLikeClick) {
      onLikeClick()
    } else {
      // Default like functionality
      try {
        const response = await fetch(`/api/comments/${id}/like`, {
          method: 'POST',
        })

        if (response.ok) {
          // Refetch comments in parent component
          window.location.reload()
        }
      } catch (error) {
        console.error('Error liking comment:', error)
      }
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: '', // This should come from parent
          content: replyContent,
          hasSpoiler: false,
          parentId: id,
        }),
      })

      if (response.ok) {
        setReplyContent('')
        setShowReplyForm(false)
        // Refetch comments in parent component
        window.location.reload()
      }
    } catch (error) {
      console.error('Error posting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refetch comments in parent component
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleReport = async () => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COMMENT',
          entityId: id,
          reason: 'Inappropriate content',
        }),
      })

      if (response.ok) {
        alert('Comment reported successfully')
      }
    } catch (error) {
      console.error('Error reporting comment:', error)
    }
  }

  const levelStyles = {
    0: '',
    1: 'ml-12 border-l-2 border-muted',
    2: 'ml-24 border-l-2 border-muted',
  }

  if (isDeleted) {
    return (
      <div className={`flex items-start gap-3 py-4 ${levelStyles[level as keyof typeof levelStyles]} ${className || ''}`}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground italic">
            This comment has been deleted
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 py-4 ${levelStyles[level as keyof typeof levelStyles]} ${className || ''}`}>
      {/* Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <Link href={`/profile/${userId}`}>
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
        </Link>
      </Avatar>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${userId}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {username}
            </Link>
            {showSpoiler && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Spoiler
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>

            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLike}
              className={`h-8 w-8 ${isLiked ? 'text-red-500' : ''}`}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 && (
                <span className="text-xs ml-1">{likesCount}</span>
              )}
            </Button>

            {/* More Options */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full z-10 min-w-[160px] bg-popover text-popover-foreground border rounded-md shadow-lg p-1 mt-2">
                  <button
                    onClick={() => {
                      setShowReplyForm(!showReplyForm)
                      setShowMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-left"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </button>

                  {level === 0 && (
                    <>
                      <button
                        onClick={() => {
                          handleDelete()
                          setShowMenu(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 hover:bg-destructive hover:text-destructive-foreground rounded-md text-left"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>

                      <button
                        onClick={() => {
                          handleReport()
                          setShowMenu(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-left"
                      >
                        <Flag className="h-4 w-4" />
                        Report
                      </button>
                    </>
                  )}

                  {level > 0 && (
                    <button
                      onClick={() => {
                        handleReport()
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-left"
                    >
                      <Flag className="h-4 w-4" />
                        Report
                      </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Text */}
        <div>
          {showSpoiler ? (
            <button
              onClick={() => setShowSpoiler(false)}
              className="w-full text-left p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
            >
              <span className="text-sm text-muted-foreground">
                Click to reveal spoiler
              </span>
            </button>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className="mt-4">
            <div className="space-y-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="resize-none"
                maxLength={2000}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Reply Button */}
        {!showReplyForm && !showReplies && onReplyClick && repliesCount > 0 && level < 2 && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onReplyClick}
              className="w-full"
            >
              <Reply className="h-4 w-4 mr-2" />
              {repliesCount} {repliesCount === 1 ? 'Reply' : 'Replies'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
