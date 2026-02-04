import { PrismaClient } from '@prisma/client'

// Adiciona o prisma ao objeto global do Nodejs
// Isso evita que o Next.js abra milhares de conexões ao recarregar a página em dev
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'], // Logs úteis no terminal
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma