import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

const globalForPrisma = prisma as global

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma = prisma
}

export const db = globalForPrisma

if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
