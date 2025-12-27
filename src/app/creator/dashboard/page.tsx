import { requireCreator } from '@/lib/auth-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Plus,
  BarChart3,
  Eye,
  Heart,
  Calendar,
  TrendingUp,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import Image from 'next/image'

async function getCreatorDashboardData() {
  const user = await requireCreator()

  const [stats, recentSeries, recentChapters] = await Promise.all([
    // Get creator statistics
    Promise.all([
      db.series.count({ where: { creatorId: user.id } }),
      db.chapter.count({ where: { authorId: user.id } }),
      db.series.aggregate({
        where: { creatorId: user.id },
        _sum: { views: true },
        _avg: { rating: true },
      }),
      db.follow.aggregate({
        where: { series: { creatorId: user.id } },
        _sum: { value: true },
      }),
    ]),

    // Get recent series
    db.series.findMany({
      where: { creatorId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { chapters: true, follows: true },
        },
      },
    }),

    // Get recent chapters
    db.chapter.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
          },
        },
        _count: {
          select: { pages: true },
        },
      },
    }),
  ])

  return {
    user,
    stats: {
      totalSeries: stats[0],
      totalChapters: stats[1],
      totalViews: stats[2]._sum.views || 0,
      averageRating: stats[3]._avg.rating || 0,
      totalFollowers: stats[4]._sum.value || 0,
    },
    recentSeries,
    recentChapters,
  }
}

export default async function CreatorDashboard() {
  const { user, stats, recentSeries, recentChapters } = await getCreatorDashboardData()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <section className="border-b bg-muted/50">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Creator Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.username}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/creator/series/new">
                <Button>
                  <Plus className="mr-2 h-5 w-5" />
                  Create Series
                </Button>
              </Link>

              <Link href="/creator/settings">
                <Button variant="outline">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="container px-4 py-8">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Overview</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Series
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    {stats.totalSeries}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Chapters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    {stats.totalChapters}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <Eye className="h-8 w-8 text-blue-500" />
                    {stats.totalViews.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Followers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <Heart className="h-8 w-8 text-red-500" />
                    {stats.totalFollowers.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-yellow-500" />
                    {stats.averageRating.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/creator/analytics">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="h-8 w-8 mx-auto" />
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          <Tabs defaultValue="series" className="w-full">
            <TabsList className="w-full md:max-w-lg grid-cols-3 h-auto">
              <TabsTrigger value="series">My Series</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="content">Content Manager</TabsTrigger>
            </TabsList>

            <TabsContent value="series" className="mt-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Series</h2>
                  <Link href="/creator/series/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Series
                    </Button>
                  </Link>
                </div>
              </div>

              {recentSeries.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No series yet</h3>
                    <p className="text-muted-foreground">
                      Start by creating your first manga or manhwa series
                    </p>
                    <Link href="/creator/series/new">
                      <Button>Create Your First Series</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentSeries.map((series) => (
                    <Card key={series.id} className="overflow-hidden">
                      <Link href={`/creator/series/${series.id}`}>
                        <div className="aspect-[3/4] overflow-hidden bg-muted">
                          <Image
                            src={series.coverImage}
                            alt={series.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-1">
                            {series.title}
                          </h3>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              <span>{series._count.chapters} chapters</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              <span>{series._count.follows} followers</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              <span>{series.views} views</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(series.updatedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}

              {recentSeries.length > 0 && (
                <div className="mt-6 text-center">
                  <Link href="/creator/series">
                    <Button variant="outline">
                      View All Series
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chapters" className="mt-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Recent Chapters</h2>
              </div>

              {recentChapters.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No chapters yet</h3>
                    <p className="text-muted-foreground">
                      Start by creating chapters for your series
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recentChapters.map((chapter) => (
                    <Card key={chapter.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Link href={`/series/${chapter.series.slug}`}>
                            <div className="flex-shrink-0 w-20 h-28 overflow-hidden rounded-md">
                              <Image
                                src={chapter.series.coverImage}
                                alt={chapter.series.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/series/${chapter.series.slug}`}
                              className="mb-1 block"
                            >
                              <h3 className="font-semibold hover:text-primary transition-colors">
                                {chapter.series.title}
                              </h3>
                            </Link>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                              <Badge variant="secondary">
                                Ch. {chapter.chapterNumber}
                              </Badge>
                              <span>{chapter.title}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(chapter.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{chapter._count.pages} pages</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{chapter.views} views</span>
                              </div>

                              {chapter.isPublished && (
                                <Badge variant="default" className="text-xs">
                                  Published
                                </Badge>
                              )}

                              {chapter.scheduledFor && (
                                <Badge variant="outline" className="text-xs">
                                  Scheduled for {new Date(chapter.scheduledFor).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href={`/creator/chapters/${chapter.id}`}
                              className="flex-1"
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                Manage
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {recentChapters.length > 0 && (
                <div className="mt-6 text-center">
                  <Link href="/creator/chapters">
                    <Button variant="outline">
                      View All Chapters
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="content" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Link href="/creator/series/new" className="block">
                        <Button className="w-full">
                          <Plus className="mr-2 h-5 w-5" />
                          Create New Series
                        </Button>
                      </Link>

                      <Link href="/creator/batch-upload" className="block">
                        <Button variant="outline" className="w-full">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Batch Upload Chapters
                        </Button>
                      </Link>

                      <Link href="/creator/drafts" className="block">
                        <Button variant="outline" className="w-full">
                          <BookOpen className="mr-2 h-5 w-5" />
                          View Drafts
                        </Button>
                      </Link>

                      <Link href="/creator/analytics" className="block">
                        <Button variant="outline" className="w-full">
                          <BarChart3 className="mr-2 h-5 w-5" />
                          View Analytics
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Series Status</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalSeries} total series
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Chapter Status</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalChapters} total chapters
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Audience Engagement</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalFollowers} followers, {stats.totalViews} views
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-yellow-500" />
                      Monetization
                    </CardTitle>
                    <Badge variant="outline">Pro</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start earning from your content by setting up paid chapters, subscriptions, or enabling ads.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Link href="/creator/monetization" className="block">
                        <Button variant="outline" className="w-full">
                          Configure Monetization
                        </Button>
                      </Link>

                      <Link href="/creator/earnings" className="block">
                        <Button variant="outline" className="w-full">
                          View Earnings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
