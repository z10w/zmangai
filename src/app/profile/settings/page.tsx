'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Mail,
  Lock,
  Eye,
  Bell,
  Settings as SettingsIcon,
  Save,
  Upload,
  LogOut,
  Shield,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

export default function ProfileSettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  // User profile state
  const [username, setUsername] = useState(session?.user?.username || '')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState(session?.user?.avatar || '')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [showReadingActivity, setShowReadingActivity] = useState(true)

  // Reader preferences
  const [readingMode, setReadingMode] = useState('VERTICAL')
  const [imageQuality, setImageQuality] = useState('HIGH')
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a')
  const [pageGap, setPageGap] = useState(0)
  const [hideUI, setHideUI] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)

  // Account deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          bio,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingMode,
          imageQuality,
          backgroundColor,
          pageGap,
          hideUI,
          autoScroll,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Preferences saved successfully',
        })
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save preferences',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New passwords do not match',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        throw new Error('Failed to change password')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to change password',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please type DELETE to confirm',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
        }),
      })

      if (response.ok) {
        await signOut({ callbackUrl: '/' })
        toast({
          title: 'Success',
          description: 'Account deleted successfully',
        })
      } else {
        throw new Error('Failed to delete account')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete account',
      })
    } finally {
      setIsSaving(false)
      setShowDeleteDialog(false)
      setDeletePassword('')
      setDeleteConfirm('')
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your profile</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header included by layout */}

      <main className="flex-1">
        {/* Page Header */}
        <section className="border-b bg-muted/50">
          <div className="container px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account and preferences
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Content */}
        <section className="py-8">
          <div className="container px-4 max-w-5xl mx-auto">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full md:max-w-lg grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="reader">Reader</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-6 space-y-6">
                {/* Basic Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-start gap-6">
                      <Avatar className="h-24 w-24">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={username}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="text-3xl">
                            {username?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2">Username</label>
                          <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2">Email</label>
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{session.user?.email}</span>
                            <Badge variant="outline">Verified</Badge>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2">Role</label>
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">
                              {session.user?.role?.toLowerCase()}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2">Bio</label>
                          <Textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell others about yourself..."
                            rows={4}
                            maxLength={500}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Actions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Member since</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.user?.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>

                    <Separator />

                    <div className="pt-4">
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="w-full"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-6 space-y-6">
                {/* Password Change Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2">Current Password</label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showPassword}
                        onCheckedChange={setShowPassword}
                      />
                      <label className="text-sm">Show passwords</label>
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {isSaving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Security Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Shield className="mr-2 h-4 w-4" />
                        Enable
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="font-medium">Active Sessions</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div>
                            <p className="text-sm font-medium">Current Session</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date().toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-6 space-y-6">
                {/* Email Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Chapter Releases</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when followed series update
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Followers</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone follows you
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Comments</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone comments on your series
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Push Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable Push Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reader Tab */}
              <TabsContent value="reader" className="mt-6 space-y-6">
                {/* Reader Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle>Reading Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={readingMode === 'VERTICAL' ? 'default' : 'outline'}
                        onClick={() => setReadingMode('VERTICAL')}
                        className="w-full"
                      >
                        Vertical Scroll
                      </Button>
                      <Button
                        variant={readingMode === 'PAGED' ? 'default' : 'outline'}
                        onClick={() => setReadingMode('PAGED')}
                        className="w-full"
                      >
                        Paged Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Image Quality */}
                <Card>
                  <CardHeader>
                    <CardTitle>Image Quality</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={imageQuality === 'LOW' ? 'default' : 'outline'}
                        onClick={() => setImageQuality('LOW')}
                        className="w-full"
                      >
                        Low
                      </Button>
                      <Button
                        variant={imageQuality === 'MEDIUM' ? 'default' : 'outline'}
                        onClick={() => setImageQuality('MEDIUM')}
                        className="w-full"
                      >
                        Medium
                      </Button>
                      <Button
                        variant={imageQuality === 'HIGH' ? 'default' : 'outline'}
                        onClick={() => setImageQuality('HIGH')}
                        className="w-full"
                      >
                        High
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Display Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Display Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Background Color</label>
                      <div className="grid grid-cols-6 gap-2">
                        {['#1a1a1a', '#0f0f0f', '#ffffff', '#f5f5f5', '#f0f0f0', '#000000'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setBackgroundColor(color)}
                            className={`w-full h-10 rounded-md border-2 ${
                              backgroundColor === color ? 'border-primary' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Page Gap</label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[pageGap]}
                          onValueChange={([value]) => setPageGap(value)}
                          min={0}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {pageGap}px
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Hide UI While Reading</label>
                        <p className="text-xs text-muted-foreground">
                          Minimize interface for immersive reading
                        </p>
                      </div>
                      <Switch
                        checked={hideUI}
                        onCheckedChange={setHideUI}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Auto Scroll</label>
                        <p className="text-xs text-muted-foreground">
                          Automatically scroll down while reading
                        </p>
                      </div>
                      <Switch
                        checked={autoScroll}
                        onCheckedChange={setAutoScroll}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save Preferences Button */}
                <Button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="w-full"
                  size="lg"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {/* Footer included by layout */}

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This action is permanent and cannot be undone. All your data including
                reading progress, follows, and comments will be deleted.
              </p>

              <div>
                <label className="text-sm font-medium mb-2">
                  Type DELETE to confirm
                </label>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="uppercase"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2">
                  Enter your password
                </label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isSaving || deleteConfirm !== 'DELETE' || !deletePassword}
                  className="flex-1"
                >
                  {isSaving ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
