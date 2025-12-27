'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, Trash2, Eye, MoreHorizontal, User, BookOpen, Heart, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Notification {
  id: string
  type: 'CHAPTER_UPDATE' | 'NEW_FOLLOWER' | 'NEW_COMMENT' | 'NEW_REVIEW' | 'NEW_LIKE' | 'RATING_UPDATE'
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string | Date
  actor?: {
    username?: string
    avatar?: string | null
  }
  data?: any
}

interface NotificationsProps {
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (notificationId: string) => void
  className?: string
}

export function Notifications({
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className,
}: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'CHAPTER_UPDATE',
      title: 'New Chapter Released',
      message: 'Shadow Monarch Chapter 5 has been released!',
      link: '/series/shadow-monarch',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      actor: {
        username: 'creator',
        avatar: '/uploads/avatars/creator-avatar.jpg',
      },
    },
    {
      id: '2',
      type: 'NEW_FOLLOWER',
      title: 'New Follower',
      message: 'user123 started following you',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      actor: {
        username: 'user123',
        avatar: '/uploads/avatars/user-avatar.jpg',
      },
    },
    {
      id: '3',
      type: 'NEW_COMMENT',
      title: 'New Comment',
      message: 'creator commented on "Shadow Monarch"',
      link: '/series/shadow-monarch',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      actor: {
        username: 'creator',
        avatar: '/uploads/avatars/creator-avatar.jpg',
      },
    },
    {
      id: '4',
      type: 'NEW_REVIEW',
      title: 'New Review',
      message: 'user123 left a review on "Shadow Monarch"',
      link: '/series/shadow-monarch',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      actor: {
        username: 'user123',
        avatar: '/uploads/avatars/user-avatar.jpg',
      },
    },
    {
      id: '5',
      type: 'NEW_LIKE',
      title: 'New Like',
      message: 'reader liked your comment on "Shadow Monarch"',
      link: '/series/shadow-monarch',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ])

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [showMenu, setShowMenu] = useState<string | null>(null)

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) =>
    filter === 'all' ? true : !notif.isRead
  )

  // Unread count
  const unreadCount = notifications.filter((notif) => !notif.isRead).length

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        )

        if (onMarkAsRead) {
          onMarkAsRead(notificationId)
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markAll: true,
        }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        )

        if (onMarkAllAsRead) {
          onMarkAllAsRead()
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    if (!confirm('Delete this notification?')) {
      return
    }

    try {
      const response = await fetch(`/api/notifications?olderThanDays=30`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))

        if (onDelete) {
          onDelete(notificationId)
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'CHAPTER_UPDATE':
        return <BookOpen className="h-5 w-5 text-blue-500" />
      case 'NEW_FOLLOWER':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'NEW_COMMENT':
        return <Bell className="h-5 w-5 text-green-500" />
      case 'NEW_REVIEW':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'NEW_LIKE':
        return <ThumbsUp className="h-5 w-5 text-purple-500" />
      case 'RATING_UPDATE':
        return <Star className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  // Get notification badge
  const getNotificationBadge = (type: Notification['type']) => {
    switch (type) {
      case 'CHAPTER_UPDATE':
        return <Badge variant="secondary">New Chapter</Badge>
      case 'NEW_FOLLOWER':
        return <Badge variant="outline">Follower</Badge>
      case 'NEW_COMMENT':
        return <Badge variant="outline">Comment</Badge>
      case 'NEW_REVIEW':
        return <Badge variant="outline">Review</Badge>
      case 'NEW_LIKE':
        return <Badge variant="outline">Like</Badge>
      case 'RATING_UPDATE':
        return <Badge variant="outline">Rating</Badge>
      default:
        return null
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Notifications</h1>

              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {unreadCount} unread
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>

              {filter === 'unread' && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="container px-4 py-8">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'You have no unread notifications' : 'You have no notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all duration-200 ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{notification.title}</h4>
                          {getNotificationBadge(notification.type)}
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>

                        {/* Actions */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMenu(showMenu === notification.id ? null : notification.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>

                          {showMenu === notification.id && (
                            <div className="absolute right-0 top-full z-10 min-w-[120px] bg-popover text-popover-foreground border rounded-md shadow-lg p-1">
                              <button
                                onClick={() => {
                                  handleDelete(notification.id)
                                  setShowMenu(null)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-left"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-sm">Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>

                      {/* Actor Info */}
                      {notification.actor && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {notification.actor.avatar ? (
                              <Image
                                src={notification.actor.avatar}
                                alt={notification.actor.username}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {notification.actor.username?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.actor.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Mark as Read */}
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Link to content */}
                  {notification.link && (
                    <div className="mt-3 pt-3 border-t">
                      <Link href={notification.link} className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Content
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
