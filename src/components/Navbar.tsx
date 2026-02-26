'use client';

import { Box, Flex, Button, Link as ChakraLink, Stack, Container, Text, Avatar, Image } from '@chakra-ui/react';
import Link from 'next/link';
import {
  LuCalendarDays, LuLayoutDashboard, LuCalendarClock,
  LuLogOut, LuShieldCheck, LuUsers, LuDoorOpen
} from "react-icons/lu";
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  // Verifica se o usuário atual é um Administrador
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <Box borderBottomWidth="1px" bg="bg.panel" position="sticky" top={0} zIndex={10}>
      <Container >
        <Flex h={16} alignItems="center" justifyContent="space-between" >
          {/* Logo / Título */}
          <ChakraLink href="/" _hover={{ textDecoration: 'none' }} fontSize="xl" fontWeight="bold" color="blue.600" bgImage={'url(./logo-1.png)'} bgRepeat={'no-repeat'} bgSize={'contain'} bgPos={'left center'} pl={10} minW={32} h={'100%'} mr={20} />

          {/* Menu Principal */}
          <Stack direction="row" gap={2} display={{ base: 'none', md: 'flex' }}>
            {/* Links Públicos (Para todos os logados) */}
            <Link href="/" >
              <Button variant="ghost" size="sm">
                <LuDoorOpen /> Salas
              </Button>
            </Link>

            <Link href="/calendario" >
              <Button variant="ghost" size="sm">
                <LuCalendarClock /> Calendário
              </Button>
            </Link>

            <Link href="/minhas-reservas" >
              <Button variant="ghost" size="sm">
                <LuCalendarDays /> Minhas Reservas
              </Button>
            </Link>

            {/* LINKS EXCLUSIVOS PARA ADMIN */}
            {isAdmin && (
              <>
                <Box w="1px" h="20px" bg="border.muted" alignSelf="center" mx={2} /> {/* Separador visual */}

                <Link href="/admin/dashboard" >
                  <Button variant="ghost" size="sm" colorPalette="purple">
                    <LuShieldCheck /> Aprovações
                  </Button>
                </Link>

                <Link href="/admin/salas" >
                  <Button variant="ghost" size="sm" colorPalette="purple">
                    <LuLayoutDashboard /> Gerir Salas
                  </Button>
                </Link>

                <Link href="/admin/usuarios" >
                  <Button variant="ghost" size="sm" colorPalette="purple">
                    <LuUsers /> Usuários
                  </Button>
                </Link>
              </>
            )}
          </Stack>

          {/* Área do Usuário (Avatar e Logout) */}
          <Flex align="center" gap={4}>
            {status === 'authenticated' && session?.user && (
              <Flex align="center" gap={3}>
                <Box textAlign="right" display={{ base: 'none', sm: 'block' }}>
                  <Flex align="center" gap={2} justify="flex-end">
                    <Text fontSize="sm" fontWeight="medium" lineHeight="1.2">
                      {session.user.name}
                    </Text>
                    {/* Badge de ADMIN ao lado do nome */}
                    {isAdmin && (
                      <Box px={1.5} py={0.5} bg="purple.100" color="purple.700" fontSize="2xs" fontWeight="bold" borderRadius="sm">
                        ADMIN
                      </Box>
                    )}
                  </Flex>
                  <Text fontSize="xs" color="fg.muted">
                    {session.user.email}
                  </Text>
                </Box>

                <Avatar.Root size="sm">
                  <Avatar.Fallback name={session.user.name || 'User'} />
                  <Avatar.Image src={session.user.image || undefined} />
                </Avatar.Root>

                {/* Botão de Sair */}
                <Button
                  variant="ghost"
                  size="sm"
                  colorPalette="red"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  title="Sair do sistema"
                  px={2}
                  ml={1}
                >
                  <LuLogOut />
                </Button>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}