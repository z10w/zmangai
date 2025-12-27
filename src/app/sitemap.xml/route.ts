import { db } from '@/lib/db'

export async function GET() {
  const [series, chapters] = await Promise.all([
    // Get all series for sitemap
    db.series.findMany({
      where: { isMature: false }, // Only include non-mature content in sitemap
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
    }),

    // Get all chapters
    db.chapter.findMany({
      where: {
        isPublished: true,
        series: { isMature: false },
      },
      select: {
        id: true,
        chapterNumber: true,
        seriesSlug: true,
        series: {
          select: {
            slug: true,
          },
        },
        updatedAt: true,
      },
    }),
  ])

  // Generate XML sitemap
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaverse.com'

  const seriesEntries = series
    .map((s) => {
      const lastmod = s.updatedAt.toISOString()
      return `
    <url>
      <loc>${baseUrl}/series/${s.slug}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`
    })
    .join('')

  const chapterEntries = chapters
    .map((c) => {
      const lastmod = c.updatedAt.toISOString()
      return `
    <url>
      <loc>${baseUrl}/reader/${c.series.slug}/${c.chapterNumber}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`
    })
    .join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${seriesEntries}
  ${chapterEntries}
</urlset>`

  // Return sitemap as XML with proper content type
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}
