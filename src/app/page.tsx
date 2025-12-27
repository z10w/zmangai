import Link from 'next/link'
import { db } from '@/lib/db'
import { SeriesCard } from '@/components/series/SeriesCard'
import { Button } from '@/components/ui/button'
import { TrendingUp, Flame, Clock, ArrowRight, Sparkles } from 'lucide-react'

async function getHomeData() {
  const [trendingSeries, popularSeries, recentSeries, newSeries] = await Promise.all([
    // Trending: views + followers weighted (views * 0.7 + followers * 0.3)
    db.series.findMany({
      where: { isMature: false },
      orderBy: { views: 'desc' },
      take: 12,
      include: {
        genres: {
          include: { genre: true },
          take: 2,
        },
        _count: {
          select: { chapters: true, follows: true },
        },
      },
    }),

    // Popular: by rating
    db.series.findMany({
      where: { isMature: false, rating: { gt: 0 } },
      orderBy: [
        { rating: 'desc' },
        { ratingCount: 'desc' },
      ],
      take: 12,
      include: {
        genres: {
          include: { genre: true },
          take: 2,
        },
        _count: {
          select: { chapters: true, follows: true },
        },
      },
    }),

    // Recently Updated: by updatedAt
    db.series.findMany({
      where: { isMature: false },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      include: {
        genres: {
          include: { genre: true },
          take: 2,
        },
        _count: {
          select: { chapters: true, follows: true },
        },
      },
    }),

    // New Releases: by createdAt
    db.series.findMany({
      where: { isMature: false },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        genres: {
          include: { genre: true },
          take: 2,
        },
        _count: {
          select: { chapters: true, follows: true },
        },
      },
    }),
  ])

  return {
    trendingSeries,
    popularSeries,
    recentSeries,
    newSeries,
  }
}

export default async function Home() {
  const { trendingSeries, popularSeries, recentSeries, newSeries } = await getHomeData()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Welcome to MangaVerse</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Discover Your Next
              <br className="text-primary">Manga Adventure</br>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Read thousands of manga and manhwa from talented creators around the world
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/discover">
                <Button size="lg" className="min-w-[160px]">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Start Reading
                </Button>
              </Link>
              <Link href="/discover">
                <Button size="lg" variant="outline" className="min-w-[160px]">
                  Browse All
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      {trendingSeries.length > 0 && (
        <section className="py-12 border-t">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold">Trending Now</h2>
              </div>
              <Link href="/discover?sort=popular">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {trendingSeries.map((series) => (
                <SeriesCard
                  key={series.id}
                  id={series.id}
                  slug={series.slug}
                  title={series.title}
                  coverImage={series.coverImage}
                  type={series.type}
                  status={series.status}
                  views={series.views}
                  followers={series._count.follows}
                  rating={series.rating}
                  genres={series.genres}
                  isMature={series.isMature}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Section */}
      {popularSeries.length > 0 && (
        <section className="py-12 border-t">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Popular Series</h2>
              </div>
              <Link href="/discover?sort=rating">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {popularSeries.map((series) => (
                <SeriesCard
                  key={series.id}
                  id={series.id}
                  slug={series.slug}
                  title={series.title}
                  coverImage={series.coverImage}
                  type={series.type}
                  status={series.status}
                  views={series.views}
                  followers={series._count.follows}
                  rating={series.rating}
                  genres={series.genres}
                  isMature={series.isMature}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Updated Section */}
      {recentSeries.length > 0 && (
        <section className="py-12 border-t">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Recently Updated</h2>
              </div>
              <Link href="/discover?sort=latest">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {recentSeries.map((series) => (
                <SeriesCard
                  key={series.id}
                  id={series.id}
                  slug={series.slug}
                  title={series.title}
                  coverImage={series.coverImage}
                  type={series.type}
                  status={series.status}
                  views={series.views}
                  followers={series._count.follows}
                  rating={series.rating}
                  genres={series.genres}
                  isMature={series.isMature}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Releases Section */}
      {newSeries.length > 0 && (
        <section className="py-12 border-t">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">New Releases</h2>
              </div>
              <Link href="/discover?sort=latest">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {newSeries.map((series) => (
                <SeriesCard
                  key={series.id}
                  id={series.id}
                  slug={series.slug}
                  title={series.title}
                  coverImage={series.coverImage}
                  type={series.type}
                  status={series.status}
                  views={series.views}
                  followers={series._count.follows}
                  rating={series.rating}
                  genres={series.genres}
                  isMature={series.isMature}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="mt-auto border-t bg-muted/50 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © 2024 MangaVerse. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
