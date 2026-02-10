'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { system } from '../theme' // Importamos nosso tema criado acima
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Trocamos o 'defaultSystem' pelo nosso 'system'
    <ChakraProvider value={system}>
      <Toaster />
      {children}
    </ChakraProvider>
  )
}