import { notFound } from 'next/navigation'
import Image from 'next/image'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Star,
  Eye,
  Heart,
  Calendar,
  BookOpen,
  User,
  Share2,
  Info,
  BookmarkPlus,
  BookMarked,
  Clock,
  FileText,
  Filter,
  ArrowLeft,
  ThumbsUp,
} from 'lucide-react'
import Link from 'next/link'
import { ChapterCard } from '@/components/series/ChapterCard'
import { ReviewCard } from '@/components/series/ReviewCard'

async function getSeriesData(slug: string) {
  const series = await db.series.findUnique({
    where: { slug },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          chapterNumber: 'desc',
        },
        include: {
          _count: {
            select: { pages: true },
          },
        },
        take: 50,
      },
      _count: {
        select: { chapters: true, follows: true },
      },
      ratings: {
        take: 10,
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
      },
      reviews: {
        where: {
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
    },
  })

  return series
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const series = await getSeriesData(params.slug)

  if (!series) {
    return {
      title: 'Series Not Found',
    }
  }

  return {
    title: `${series.title} - MangaVerse`,
    description: series.description || `Read ${series.title} on MangaVerse`,
    openGraph: {
      title: series.title,
      description: series.description || undefined,
      images: series.coverImage ? [series.coverImage] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: series.title,
      description: series.description || undefined,
      images: series.coverImage ? [series.coverImage] : undefined,
    },
  }
}

export default async function SeriesDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const series = await getSeriesData(params.slug)

  if (!series) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Series Header */}
      <section className="relative">
        {/* Banner */}
        {series.bannerImage && (
          <div className="h-48 md:h-64 w-full overflow-hidden bg-muted">
            <Image
              src={series.bannerImage}
              alt={series.title}
              fill
              className="object-cover opacity-50"
              priority
            />
          </div>
        )}

        {/* Header Content */}
        <div className="container px-4 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              <div className="w-40 md:w-48 aspect-[3/4] overflow-hidden rounded-lg shadow-lg bg-muted">
                <Image
                  src={series.coverImage}
                  alt={series.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            </div>

            {/* Series Info */}
            <div className="flex-1 space-y-4">
              <div>
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Browse
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold">{series.title}</h1>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{series.type}</Badge>
                  <Badge
                    variant={series.status === 'ONGOING' ? 'default' : 'secondary'}
                  >
                    {series.status}
                  </Badge>
                  {series.isMature && (
                    <Badge variant="destructive">Mature</Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{series.author}</span>
                </div>

                {series.artist && (
                  <div className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    <span>Art: {series.artist}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{series._count.chapters} chapters</span>
                </div>

                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{series._count.follows} followers</span>
                </div>

                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{series.views} views</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                {series.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-lg font-semibold">{series.rating.toFixed(1)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{series.ratingCount} ratings</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button size="lg" className="flex-1">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Start Reading
                </Button>

                <Button size="lg" variant="outline">
                  <BookmarkPlus className="mr-2 h-5 w-5" />
                  Follow
                </Button>

                <Button size="lg" variant="outline">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-8">
        <div className="container px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full md:max-w-md grid-cols-4 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chapters">
                Chapters ({series._count.chapters})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({series.reviews.length})
              </TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Description */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {series.description || 'No description available.'}
                  </p>
                </CardContent>
              </Card>

              {/* Genres & Tags */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-3">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {series.genres.map(({ genre }) => (
                        <Badge key={genre.name} variant="secondary">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {series.tags.map(({ tag }) => (
                        <Badge key={tag.name} variant="outline">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Creator Info */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Creator
                  </h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {series.creator.avatar ? (
                        <Image
                          src={series.creator.avatar}
                          alt={series.creator.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback>
                          {series.creator.username?.substring(0, 2).toUpperCase() || 'CR'}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1">
                      <Link
                        href={`/creators/${series.creator.username}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {series.creator.username}
                      </Link>
                      <Badge variant="outline" className="ml-2">
                        {series.creator.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Release Schedule */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Release Schedule
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">{series.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language:</span>
                      <span className="font-medium">{series.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span className="font-medium">
                        {new Date(series.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chapters Tab */}
            <TabsContent value="chapters" className="mt-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">All Chapters</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {series.chapters.map((chapter) => (
                  <ChapterCard
                    key={chapter.id}
                    id={chapter.id}
                    seriesSlug={series.slug}
                    seriesTitle={series.title}
                    chapterNumber={chapter.chapterNumber}
                    title={chapter.title}
                    views={chapter.views}
                    pageCount={chapter._count.pages}
                    publishedAt={chapter.publishedAt}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6 space-y-6">
              {/* Overall Rating */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-5xl font-bold flex items-center justify-center gap-3">
                      <Star className="h-10 w-10 fill-yellow-500 text-yellow-500" />
                      {series.rating.toFixed(1)}
                    </div>
                    <p className="text-muted-foreground">
                      Based on {series.ratingCount} ratings
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Reviews */}
              <div className="space-y-4">
                {series.reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    id={review.id}
                    userId={review.userId}
                    username={review.user.username}
                    avatar={review.user.avatar}
                    content={review.content}
                    hasSpoiler={review.hasSpoiler}
                    createdAt={review.createdAt}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Total Views
                    </h3>
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">{series.views.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Total Followers
                    </h3>
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">{series._count.follows.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Total Chapters
                    </h3>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">{series._count.chapters.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Total Ratings
                    </h3>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">{series.ratingCount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Ratings */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Ratings</h3>
                  <div className="space-y-3">
                    {series.ratings.map((rating) => (
                      <div key={rating.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {rating.user.avatar ? (
                              <Image
                                src={rating.user.avatar}
                                alt={rating.user.username}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {rating.user.username?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{rating.user.username}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold">{rating.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
