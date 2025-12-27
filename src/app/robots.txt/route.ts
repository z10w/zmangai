import { db } from '@/lib/db'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaverse.com'

  // Disallow certain paths
  const disallowedPaths = [
    '/api/',
    '/admin/',
    '/creator/',
  ]

  // Get all series for sitemap reference
  const series = await db.series.findMany({
    where: { isMature: false },
    select: { slug: true },
  })

  const sitemapRef = `Sitemap: ${baseUrl}/sitemap.xml`

  const robotsTxt = `# Robots.txt for MangaVerse
# Allow all user agents
User-agent: *
# Disallow specific paths
${disallowedPaths.map((path) => `Disallow: ${path}`).join('\n')}
# Sitemap location
${sitemapRef}
# Crawl delay (optional)
Crawl-delay: 1`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}
