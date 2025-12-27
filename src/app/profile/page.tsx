'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Camera, Save, Settings } from 'lucide-react'
import { updateUserSchema } from '@/lib/validations'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  // Fetch current user data
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    fetchUser()
  }, [])

  async function handleUpdateProfile() {
    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      const username = (document.getElementById('username') as HTMLInputElement)?.value
      const bio = (document.getElementById('bio') as HTMLInputElement)?.value
      const avatar = (document.getElementById('avatar') as HTMLInputElement)?.value

      if (username) formData.append('username', username)
      if (bio) formData.append('bio', bio)
      if (avatar) formData.append('avatar', avatar)

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setMessage('Profile updated successfully!')
        update()

        // Refresh session with new data
        await update({
          user: {
            ...session?.user,
            username: data.user.username,
            avatar: data.user.avatar,
          },
        })
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please sign in to view your profile</p>
            <Button onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile() }} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.username || ''} />
                  <AvatarFallback className="text-2xl">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      defaultValue={user?.username || ''}
                      placeholder="Your username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      type="url"
                      defaultValue={user?.avatar || ''}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
                <Button variant="outline" size="icon" type="button">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  defaultValue={user?.bio || ''}
                  placeholder="Tell others about yourself..."
                  rows={4}
                  maxLength={500}
                />
              </div>

              {message && (
                <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-destructive'}`}>
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Reader Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Customize your reading experience
            </p>
            <div className="space-y-4">
              <div>
                <Label>Reading Mode</Label>
                <Select defaultValue="vertical">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical Scroll</SelectItem>
                    <SelectItem value="paged">Paged Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reading Direction</Label>
                <Select defaultValue="ltr">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltr">Left to Right</SelectItem>
                    <SelectItem value="rtl">Right to Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
            </div>
            <div>
              <Label>Role</Label>
              <p className="text-sm text-muted-foreground capitalize">{user?.role || 'USER'}</p>
            </div>
            <div>
              <Label>Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => window.location.href = '/api/auth/signout'}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
