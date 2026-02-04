'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { system } from '../theme' // Importamos nosso tema criado acima

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Trocamos o 'defaultSystem' pelo nosso 'system'
    <ChakraProvider value={system}>
      {children}
    </ChakraProvider>
  )
}