import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================================
  // 1. Create Users
  // ============================================
  console.log('📝 Creating users...')

  const hashedAdminPassword = await bcrypt.hash('Admin123!', 12)
  const hashedCreatorPassword = await bcrypt.hash('Creator123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mangaverse.com' },
    update: {},
    create: {
      email: 'admin@mangaverse.com',
      username: 'admin',
      password: hashedAdminPassword,
      role: 'ADMIN',
      bio: 'Platform Administrator',
    },
  })

  const creator = await prisma.user.upsert({
    where: { email: 'creator@mangaverse.com' },
    update: {},
    create: {
      email: 'creator@mangaverse.com',
      username: 'creator',
      password: hashedCreatorPassword,
      role: 'CREATOR',
      bio: 'Content Creator',
    },
  })

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@mangaverse.com' },
    update: {},
    create: {
      email: 'user@mangaverse.com',
      username: 'reader',
      password: await bcrypt.hash('User123!', 12),
      role: 'USER',
      bio: 'Manga enthusiast',
    },
  })

  console.log(`✅ Created users: admin, creator, reader`)

  // ============================================
  // 2. Create Genres
  // ============================================
  console.log('📚 Creating genres...')

  const genres = [
    { name: 'Action', slug: 'action', description: 'High-energy battles and combat' },
    { name: 'Adventure', slug: 'adventure', description: 'Journey and exploration' },
    { name: 'Fantasy', slug: 'fantasy', description: 'Magic and supernatural worlds' },
    { name: 'Romance', slug: 'romance', description: 'Love and relationships' },
    { name: 'Comedy', slug: 'comedy', description: 'Humorous and entertaining' },
    { name: 'Drama', slug: 'drama', description: 'Emotional and serious stories' },
    { name: 'Horror', slug: 'horror', description: 'Scary and suspenseful' },
    { name: 'Mystery', slug: 'mystery', description: 'Puzzles and investigations' },
    { name: 'Sci-Fi', slug: 'sci-fi', description: 'Science and futuristic' },
    { name: 'Slice of Life', slug: 'slice-of-life', description: 'Everyday life stories' },
  ]

  const createdGenres = await Promise.all(
    genres.map((genre) =>
      prisma.genre.upsert({
        where: { slug: genre.slug },
        update: {},
        create: genre,
      })
    )
  )

  console.log(`✅ Created ${createdGenres.length} genres`)

  // ============================================
  // 3. Create Tags
  // ============================================
  console.log('🏷️  Creating tags...')

  const tags = [
    { name: 'Overpowered MC', slug: 'overpowered-mc' },
    { name: 'Isekai', slug: 'isekai' },
    { name: 'Reincarnation', slug: 'reincarnation' },
    { name: 'Magic', slug: 'magic' },
    { name: 'Demons', slug: 'demons' },
    { name: 'Martial Arts', slug: 'martial-arts' },
    { name: 'School Life', slug: 'school-life' },
    { name: 'Gaming', slug: 'gaming' },
    { name: 'Supernatural', slug: 'supernatural' },
    { name: 'Time Travel', slug: 'time-travel' },
  ]

  const createdTags = await Promise.all(
    tags.map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      })
    )
  )

  console.log(`✅ Created ${createdTags.length} tags`)

  // ============================================
  // 4. Create Series
  // ============================================
  console.log('📖 Creating series...')

  const series = [
    {
      slug: 'shadow-monarch',
      title: 'Shadow Monarch',
      alternativeTitles: JSON.stringify(['Solo Leveling', 'The Shadow Queen']),
      description: 'In a world where hunters battle monsters, the weakest hunter suddenly gains the power to level up infinitely.',
      coverImage: '/uploads/series/shadow-monarch-cover.jpg',
      author: 'creator',
      artist: 'artist1',
      type: 'MANHWA',
      status: 'ONGOING',
      language: 'en',
      isMature: false,
      views: 150000,
      followers: 12000,
      rating: 4.8,
      ratingCount: 3500,
      genreIndices: [0, 1, 2],
      tagIndices: [0, 3],
    },
    {
      slug: 'academy-gifted',
      title: 'Academy of the Gifted',
      alternativeTitles: JSON.stringify(['Magic Academy']),
      description: 'A young boy discovers his magical abilities and enrolls in the most prestigious magic academy.',
      coverImage: '/uploads/series/academy-gifted-cover.jpg',
      author: 'creator',
      artist: 'artist2',
      type: 'MANHWA',
      status: 'ONGOING',
      language: 'en',
      isMature: false,
      views: 98000,
      followers: 8500,
      rating: 4.5,
      ratingCount: 2100,
      genreIndices: [2, 4, 6],
      tagIndices: [3, 6],
    },
    {
      slug: 'romance-coffee-shop',
      title: 'Love at the Coffee Shop',
      alternativeTitles: JSON.stringify(['Cafe Romance']),
      description: 'A heartwarming romance about two strangers who meet at a cozy coffee shop.',
      coverImage: '/uploads/series/romance-coffee-cover.jpg',
      author: 'creator',
      artist: 'artist3',
      type: 'MANHWA',
      status: 'ONGOING',
      language: 'en',
      isMature: false,
      views: 75000,
      followers: 6200,
      rating: 4.7,
      ratingCount: 1800,
      genreIndices: [3, 4, 9],
      tagIndices: [6],
    },
  ]

  const createdSeries = await Promise.all(
    series.map(async (s) => {
      const created = await prisma.series.upsert({
        where: { slug: s.slug },
        update: {},
        create: {
          slug: s.slug,
          title: s.title,
          alternativeTitles: s.alternativeTitles,
          description: s.description,
          coverImage: s.coverImage,
          author: s.author,
          artist: s.artist,
          type: s.type as any,
          status: s.status as any,
          language: s.language,
          isMature: s.isMature,
          views: s.views,
          followers: s.followers,
          rating: s.rating,
          ratingCount: s.ratingCount,
          creatorId: creator.id,
        },
      })

      // Connect genres (skip if already exists)
      for (const genreIndex of s.genreIndices) {
        try {
          await prisma.seriesGenre.create({
            data: {
              seriesId: created.id,
              genreId: createdGenres[genreIndex].id,
            },
          })
        } catch (e: any) {
          // Ignore duplicate errors
          if (e.code !== 'P2002') {
            throw e
          }
        }
      }

      // Connect tags (skip if already exists)
      for (const tagIndex of s.tagIndices) {
        try {
          await prisma.seriesTag.create({
            data: {
              seriesId: created.id,
              tagId: createdTags[tagIndex].id,
            },
          })
        } catch (e: any) {
          // Ignore duplicate errors
          if (e.code !== 'P2002') {
            throw e
          }
        }
      }

      return created
    })
  )

  console.log(`✅ Created ${createdSeries.length} series`)

  // ============================================
  // 5. Create Chapters and Pages
  // ============================================
  console.log('📄 Creating chapters and pages...')

  for (const seriesItem of createdSeries) {
    const chapterCount = seriesItem.slug === 'shadow-monarch' ? 5 : 3

    for (let i = 1; i <= chapterCount; i++) {
      const chapter = await prisma.chapter.upsert({
        where: {
          seriesId_chapterNumber: {
            seriesId: seriesItem.id,
            chapterNumber: i,
          },
        },
        update: {},
        create: {
          seriesId: seriesItem.id,
          chapterNumber: i,
          title: `Chapter ${i}`,
          volume: 1,
          pageCount: 20,
          views: Math.floor(Math.random() * 50000) + 10000,
          isPublished: true,
          publishedAt: new Date(Date.now() - (chapterCount - i) * 7 * 24 * 60 * 60 * 1000),
          authorId: creator.id,
        },
      })

      // Create pages (skip if already exists)
      const existingPages = await prisma.page.findMany({
        where: { chapterId: chapter.id },
      })

      if (existingPages.length === 0) {
        for (let j = 1; j <= 20; j++) {
          await prisma.page.create({
            data: {
              chapterId: chapter.id,
              imageUrl: `/uploads/chapters/${seriesItem.slug}/${chapter.id}/${j}.jpg`,
              order: j,
              width: 800,
              height: 1200,
            },
          })
        }
      }
    }
  }

  console.log(`✅ Created chapters and pages`)

  // ============================================
  // 6. Create Sample Comments
  // ============================================
  console.log('💬 Creating sample comments...')

  const firstChapter = await prisma.chapter.findFirst({
    where: { seriesId: createdSeries[0].id, chapterNumber: 1 },
  })

  if (firstChapter) {
    const existingComments = await prisma.comment.findMany({
      where: { chapterId: firstChapter.id },
    })

    if (existingComments.length === 0) {
      await prisma.comment.create({
        data: {
          content: 'This is amazing! Love the artwork and story progression.',
          hasSpoiler: false,
          userId: regularUser.id,
          chapterId: firstChapter.id,
        },
      })

      await prisma.comment.create({
        data: {
          content: 'The MC is so cool! Can\'t wait for the next chapter.',
          hasSpoiler: false,
          userId: regularUser.id,
          chapterId: firstChapter.id,
        },
      })
    }
  }

  console.log(`✅ Created sample comments`)

  // ============================================
  // 7. Create Sample Ratings and Reviews
  // ============================================
  console.log('⭐ Creating sample ratings and reviews...')

  const existingRating1 = await prisma.rating.findUnique({
    where: {
      userId_seriesId: {
        userId: regularUser.id,
        seriesId: createdSeries[0].id,
      },
    },
  })

  if (!existingRating1) {
    await prisma.rating.create({
      data: {
        rating: 5,
        userId: regularUser.id,
        seriesId: createdSeries[0].id,
      },
    })
  }

  const existingRating2 = await prisma.rating.findUnique({
    where: {
      userId_seriesId: {
        userId: regularUser.id,
        seriesId: createdSeries[1].id,
      },
    },
  })

  if (!existingRating2) {
    await prisma.rating.create({
      data: {
        rating: 4,
        userId: regularUser.id,
        seriesId: createdSeries[1].id,
      },
    })
  }

  const existingReviews = await prisma.review.findMany({
    where: { userId: regularUser.id },
  })

  if (existingReviews.length === 0) {
    await prisma.review.create({
      data: {
        content: 'Incredible world-building and character development. Highly recommended for fantasy fans!',
        hasSpoiler: false,
        userId: regularUser.id,
        seriesId: createdSeries[0].id,
      },
    })
  }

  console.log(`✅ Created sample ratings and reviews`)

  // ============================================
  // 8. Create Sample Follows
  // ============================================
  console.log('❤️  Creating sample follows...')

  for (const seriesItem of createdSeries) {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_seriesId: {
          userId: regularUser.id,
          seriesId: seriesItem.id,
        },
      },
    })

    if (!existingFollow) {
      await prisma.follow.create({
        data: {
          userId: regularUser.id,
          seriesId: seriesItem.id,
        },
      })
    }
  }

  console.log(`✅ Created sample follows`)

  // ============================================
  // 9. Create Reader Preferences for user
  // ============================================
  console.log('⚙️  Creating reader preferences...')

  const existingPreferences = await prisma.readerPreferences.findUnique({
    where: { userId: regularUser.id },
  })

  if (!existingPreferences) {
    await prisma.readerPreferences.create({
      data: {
        userId: regularUser.id,
        readingMode: 'VERTICAL',
        direction: 'LTR',
        imageQuality: 'HIGH',
        backgroundColor: '#1a1a1a',
        pageGap: 0,
        hideUI: false,
        autoScroll: false,
      },
    })
  }

  console.log(`✅ Created reader preferences`)

  console.log('\n🎉 Database seed completed successfully!\n')
  console.log('====================================')
  console.log('CREDENTIALS')
  console.log('====================================')
  console.log('Admin Email: admin@mangaverse.com')
  console.log('Admin Password: Admin123!')
  console.log('')
  console.log('Creator Email: creator@mangaverse.com')
  console.log('Creator Password: Creator123!')
  console.log('')
  console.log('User Email: user@mangaverse.com')
  console.log('User Password: User123!')
  console.log('====================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
