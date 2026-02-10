'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { system } from '../theme'
import { Toaster } from '@/components/ui/toaster'
import { useState, useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // useEffect roda apenas no cliente após a primeira renderização
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ChakraProvider value={system}>
      {/* Só renderiza o Toaster quando estivermos no navegador (mounted) */}
      {mounted && <Toaster />}
      {children}
    </ChakraProvider>
  )
}