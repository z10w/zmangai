import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { Button } from '@/components/ui/button'
import { BookOpen, Heart, Clock, History } from 'lucide-react'
import Link from 'next/link'

async function getLibraryData() {
  const session = await getServerSession()
  const userId = session?.user?.id
  
  if (!userId) {
    return { follows: [], history: [], continueReading: [] }
  }
  
  const follows = await db.follow.findMany({
    where: { userId },
    include: {
      series: {
        include: {
          genres: {
            include: { genre: true },
            take: 2,
          },
          _count: {
            select: { chapters: true, follows: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  
  const history = await db.history.findMany({
    where: { userId },
    include: {
      series: {
        include: {
          genres: {
            include: { genre: true },
            take: 2,
          },
          _count: {
            select: { chapters: true, follows: true },
          },
        },
        chapters: {
          where: { isPublished: true },
          orderBy: { chapterNumber: 'desc' },
          take: 1,
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    distinct: ['seriesId'],
  })
  
  const continueReading = await db.readingProgress.findMany({
    where: { userId },
    include: {
      chapter: {
        include: {
          series: {
            include: {
              genres: {
                include: { genre: true },
                take: 2,
              },
              _count: {
                select: { chapters: true, follows: true },
              },
            },
          },
        },
      },
    },
    orderBy: { lastReadAt: 'desc' },
    take: 10,
  })
  
  return { follows, history, continueReading }
}

export default async function LibraryPage() {
  const { follows, history, continueReading } = await getLibraryData()
  
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-6">My Library</h1>
      
      <div className="grid gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Continue Reading</h2>
          {continueReading.length === 0 ? (
            <p className="text-muted-foreground">No reading in progress</p>
          ) : (
            <div className="space-y-2">
              {continueReading.map((item: any) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{item.chapter?.series?.title}</p>
                  <Link href={`/reader/${item.chapter?.series?.slug}/${item.chapter?.chapterNumber}`}>
                    <Button size="sm">Continue</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Following ({follows.length})</h2>
          {follows.length === 0 ? (
            <p className="text-muted-foreground">No followed series</p>
          ) : (
            <div className="space-y-2">
              {follows.map((follow: any) => (
                <div key={follow.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{follow.series.title}</p>
                  <Link href={`/series/${follow.series.slug}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">History ({history.length})</h2>
          {history.length === 0 ? (
            <p className="text-muted-foreground">No reading history</p>
          ) : (
            <div className="space-y-2">
              {history.map((item: any) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{item.series.title}</p>
                  <Link href={`/series/${item.series.slug}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
