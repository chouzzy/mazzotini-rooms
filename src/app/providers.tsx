'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { system } from '../theme'
import { Toaster } from '@/components/ui/toaster'
import { useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ColorModeProvider } from '@/components/ui/color-mode'
import './globals.css'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SessionProvider>
      <ColorModeProvider defaultTheme="dark" forcedTheme="dark">
        <ChakraProvider value={system}>
          {/* Envolvemos o app no ColorModeProvider forçando o modo escuro */}
          {mounted && <Toaster />}
          {children}
        </ChakraProvider>
      </ColorModeProvider>
    </SessionProvider>
  )
}