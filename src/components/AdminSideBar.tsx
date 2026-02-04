'use client'

import { Box, VStack, Text, Flex } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Salas', href: '/admin/salas', icon: '🏠' },
  { label: 'Usuários', href: '/admin/usuarios', icon: '👥' },
  { label: 'Reservas', href: '/admin/reservas', icon: '📅' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Box 
      w="250px" 
      h="100vh" 
      bg="brand.900" 
      color="white" 
      position="fixed" 
      left={0} 
      top={0}
      p={5}
    >
      <Text fontSize="2xl" fontWeight="bold" mb={10} color="brand.100">
        Mazzotini Admin
      </Text>

      <VStack align="stretch" gap={2}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              {/* CORREÇÃO: Usamos Box em vez de ChakraLink para evitar <a> dentro de <a> */}
              <Box
                display="flex"
                alignItems="center"
                p={3}
                borderRadius="md"
                bg={isActive ? 'brand.700' : 'transparent'}
                color={isActive ? 'white' : 'brand.100'}
                _hover={{ bg: 'brand.800' }}
                fontWeight={isActive ? 'bold' : 'normal'}
                cursor="pointer" // Importante para parecer clicável
                transition="all 0.2s"
              >
                <Text mr={3}>{item.icon}</Text>
                {item.label}
              </Box>
            </Link>
          )
        })}
      </VStack>

      <Box position="absolute" bottom={5}>
        <Text fontSize="sm" opacity={0.6}>Versão 1.0.0</Text>
      </Box>
    </Box>
  )
}