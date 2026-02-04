import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import { prisma } from './prisma'

// Isso diz ao Jest: "Quando alguém importar ./prisma, entregue o mock, não o original"
jest.mock('./prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}))

// Exporta o mock tipado para usarmos nos testes
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>