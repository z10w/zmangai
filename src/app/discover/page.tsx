import Link from 'next/link'
import { db } from '@/lib/db'
import { SeriesCard } from '@/components/series/SeriesCard'
import { Button } from '@/components/ui/button'
import { Search, Filter, Grid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'

async function getDiscoverData(searchParams: Promise<URLSearchParams>) {
  const searchParams = await searchParams
  const search = searchParams.get('search') || ''
  const genre = searchParams.get('genre') || undefined
  const type = searchParams.get('type') as 'MANGA' | 'MANHWA' | 'MANHUA' | null
  const status = searchParams.get('status') as 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'CANCELLED' | null
  const sort = searchParams.get('sort') || 'latest'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '24')

  const where: any = {
    isMature: false,
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (genre) {
    where.genres = {
      some: {
        genre: { slug: genre },
      },
    }
  }

  if (type) {
    where.type = type
  }

  if (status) {
    where.status = status
  }

  let orderBy: any = { updatedAt: 'desc' }
  switch (sort) {
    case 'popular':
      orderBy = { views: 'desc' }
      break
    case 'rating':
      orderBy = [{ rating: 'desc' }, { ratingCount: 'desc' }]
      break
    case 'alphabetical':
      orderBy = { title: 'asc' }
      break
    case 'latest':
    default:
      orderBy = { createdAt: 'desc' }
      break
  }

  const [series, total] = await Promise.all([
    db.series.findMany({
      where,
      include: {
        genres: {
          include: {
            genre: true,
          },
          take: 2,
        },
        _count: {
          select: { chapters: true, follows: true },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.series.count({ where }),
  ])

  return { series, total, page, limit }
}

export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>
}) {
  const { series, total, page, limit } = await getDiscoverData(searchParams)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="border-b bg-muted/50">
          <div className="container px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-2xl">
                <h1 className="text-3xl font-bold mb-2">Discover</h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="search"
                    type="text"
                    placeholder="Search by title, author, or genre..."
                    defaultValue={await searchParams.get('search') || ''}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/discover">
                  <Button variant="ghost" size="sm">
                    <Grid className="h-4 w-4 mr-2" />
                    Grid
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button variant="ghost" size="sm">
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container px-4">
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href="/discover">
                <Button variant={type === null ? 'default' : 'outline'} size="sm">
                  All Types
                </Button>
              </Link>
              <Link href="/discover?type=MANGA">
                <Button variant={type === 'MANGA' ? 'default' : 'outline'} size="sm">
                  Manga
                </Button>
              </Link>
              <Link href="/discover?type=MANHWA">
                <Button variant={type === 'MANHWA' ? 'default' : 'outline'} size="sm">
                  Manhwa
                </Button>
              </Link>
              <Link href="/discover?type=MANHUA">
                <Button variant={type === 'MANHUA' ? 'default' : 'outline'} size="sm">
                  Manhua
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/discover">
              <Button variant={status === null ? 'default' : 'outline'} size="sm">
                  All Status
                </Button>
              </Link>
              <Link href="/discover?status=ONGOING">
                <Button variant={status === 'ONGOING' ? 'default' : 'outline'} size="sm">
                  Ongoing
                </Button>
              </Link>
              <Link href="/discover?status=COMPLETED">
                <Button variant={status === 'COMPLETED' ? 'default' : 'outline'} size="sm">
                  Completed
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/discover">
              <Button variant={sort === 'latest' ? 'default' : 'outline'} size="sm">
                  Latest
                </Button>
              </Link>
              <Link href="/discover?sort=popular">
                <Button variant={sort === 'popular' ? 'default' : 'outline'} size="sm">
                  Popular
                </Button>
              </Link>
              <Link href="/discover?sort=rating">
                <Button variant={sort === 'rating' ? 'default' : 'outline'} size="sm">
                  Top Rated
                </Button>
              </Link>
            </div>
          </div>

          <div className="container px-4">
            {series.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {total} series
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {series.map((s) => (
                    <SeriesCard
                      key={s.id}
                      id={s.id}
                      slug={s.slug}
                      title={s.title}
                      coverImage={s.coverImage}
                      type={s.type}
                      status={s.status}
                      views={s.views}
                      followers={s._count.follows}
                      rating={s.rating}
                      genres={s.genres}
                      isMature={s.isMature}
                    />
                  ))}
                </div>
                {total > limit && (
                  <div className="flex justify-center items-center gap-4 mt-12">
                    <Link href={{
                      pathname: '/discover',
                      query: page > 1 ? { ...Object.fromEntries(searchParams), page: (page - 1).toString() } : undefined,
                    }}
                    >
                      <Button variant="outline" disabled={page <= 1}>
                        Previous
                      </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {Math.ceil(total / limit)}
                    </span>
                    <Link href={{
                      pathname: '/discover',
                      query: page * limit < total ? { ...Object.fromEntries(searchParams), page: (page + 1).toString() } : undefined,
                    }}
                    >
                      <Button variant="outline" disabled={page * limit >= total}>
                        Next
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
