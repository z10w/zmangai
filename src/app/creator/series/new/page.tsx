'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, Image as ImageIcon, X, ArrowLeft, Loader2, Check } from 'lucide-react'
import { uploadSeriesCover, uploadSeriesBanner } from '@/lib/storage'
import { useToast } from '@/hooks/use-toast'

const TYPE_OPTIONS = [
  { value: 'MANGA', label: 'Manga' },
  { value: 'MANHWA', label: 'Manhwa' },
  { value: 'MANHUA', label: 'Manhua' },
]

const STATUS_OPTIONS = [
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'HIATUS', label: 'Hiatus' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function CreateSeriesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [alternativeTitles, setAlternativeTitles] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [artist, setArtist] = useState('')
  const [type, setType] = useState('MANGA')
  const [status, setStatus] = useState('ONGOING')
  const [isMature, setIsMature] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Mock genres and tags (in real app, would fetch from API)
  const genres = [
    { id: '1', name: 'Action' },
    { id: '2', name: 'Romance' },
    { id: '3', name: 'Fantasy' },
    { id: '4', name: 'Comedy' },
    { id: '5', name: 'Drama' },
    { id: '6', name: 'Horror' },
    { id: '7', name: 'Adventure' },
    { id: '8', name: 'Mystery' },
    { id: '9', name: 'Sci-Fi' },
  ]

  const tags = [
    { id: '1', name: 'Strong MC' },
    { id: '2', name: 'Fast Paced' },
    { id: '3', name: 'Magic' },
    { id: '4', name: 'Martial Arts' },
    { id: '5', name: 'Isekai' },
    { id: '6', name: 'Reincarnation' },
  ]

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCover = () => {
    setCoverImage(null)
    setCoverPreview(null)
  }

  const handleRemoveBanner = () => {
    setBannerImage(null)
    setBannerPreview(null)
  }

  const handleGenreToggle = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    )
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!title.trim() || !author.trim()) {
        throw new Error('Title and Author are required')
      }

      if (selectedGenres.length === 0) {
        throw new Error('Please select at least one genre')
      }

      let coverUrl = ''
      let bannerUrl = ''

      if (coverImage) {
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        const result = await uploadSeriesCover(coverImage, slug)
        coverUrl = result.url
      }

      if (bannerImage) {
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        const result = await uploadSeriesBanner(bannerImage, slug)
        bannerUrl = result.url
      }

      const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          alternativeTitles: alternativeTitles.trim() || undefined,
          description: description.trim() || undefined,
          coverImage: coverUrl || '/uploads/default-cover.jpg',
          bannerImage: bannerUrl || undefined,
          author: author.trim(),
          artist: artist.trim() || undefined,
          type,
          status,
          isMature,
          genreIds: selectedGenres,
          tagIds: selectedTags,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Series created successfully',
        })
        router.push(`/creator/series/${data.series.id}`)
      } else {
        throw new Error('Failed to create series')
      }
    } catch (error: any) {
      console.error('Error creating series:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create series',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access this page</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Page Header */}
        <section className="border-b bg-muted/50">
          <div className="container px-4 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/creator/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-3xl font-bold">Create New Series</h1>
                <p className="text-muted-foreground">
                  Add a new manga or manhwa to the platform
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Content */}
        <section className="py-8">
          <div className="container px-4 max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter series title"
                      maxLength={200}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {title.length} / 200 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="alternativeTitles">Alternative Titles</Label>
                    <Input
                      id="alternativeTitles"
                      value={alternativeTitles}
                      onChange={(e) => setAlternativeTitles(e.target.value)}
                      placeholder="Enter alternative titles (optional)"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use semicolons to separate multiple titles
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Enter author name"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Enter artist name (optional)"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter series description"
                      rows={5}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {description.length} / 2000 characters
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Type and Status */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              {/* Mature Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Mature Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Mark as Mature</p>
                      <p className="text-sm text-muted-foreground">
                        This content is suitable for adult audiences only
                      </p>
                    </div>
                    <Switch
                      checked={isMature}
                      onCheckedChange={setIsMature}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Genres */}
              <Card>
                <CardHeader>
                  <CardTitle>Genres *</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select at least one genre
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => handleGenreToggle(genre.id)}
                        className={`px-4 py-2 rounded-md border-2 transition-colors ${
                          selectedGenres.includes(genre.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                  {selectedGenres.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags (Optional)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add tags to help readers discover your series
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-4 py-2 rounded-md border-2 transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Images */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cover Image</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Recommended: 600x800, JPG/PNG
                    </p>
                  </CardHeader>
                  <CardContent>
                    {coverPreview ? (
                      <div className="space-y-4">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                          <img
                            src={coverPreview}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveCover}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('cover-upload')?.click()}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        id="cover-upload"
                        onClick={() => document.getElementById('cover-input')?.click()}
                        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">Upload Cover Image</p>
                        <p className="text-sm text-muted-foreground">
                          Click or drag and drop
                        </p>
                        <input
                          id="cover-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Banner Image (Optional)</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Recommended: 1920x600, JPG/PNG
                    </p>
                  </CardHeader>
                  <CardContent>
                    {bannerPreview ? (
                      <div className="space-y-4">
                        <div className="relative aspect-[16/5] overflow-hidden rounded-lg bg-muted">
                          <img
                            src={bannerPreview}
                            alt="Banner preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveBanner}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('banner-input')?.click()}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        id="banner-upload"
                        onClick={() => document.getElementById('banner-input')?.click()}
                        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">Upload Banner Image</p>
                        <p className="text-sm text-muted-foreground">
                          Click or drag and drop (optional)
                        </p>
                        <input
                          id="banner-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleBannerUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/creator/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !author.trim() || selectedGenres.length === 0}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Create Series
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
