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
    <Box borderBottomWidth="1px" bg="bg.panel" position="sticky" top={0} zIndex={10} w='100%'>
      <Flex alignItems="center" justifyContent="space-between" w='100%' px={8}>
        {/* Logo / Título */}
        <ChakraLink href="/" _hover={{ textDecoration: 'none' }} fontSize="xl" fontWeight="bold" color="blue.600" bgImage={isAdmin? 'url(/logo-admin.png)' : 'url(/logo.png)'} bgRepeat={'no-repeat'} bgSize={'contain'} bgPos={'center'}
          minW={28} h={16} my={2} />

        {/* Menu Principal */}
        <Stack direction="row" gap={2} display={{ base: 'none', md: 'flex' }} position="absolute" left="50%" transform="translateX(-50%)">
          {/* Links Públicos (Para todos os logados) */}
          <Link href="/salas" >
            <Button _hover={{ bgColor: '#436fff33' }} variant="ghost" size="md" h={16} fontWeight={'normal'}>
              <LuDoorOpen /> Salas
            </Button>
          </Link>

          <Link href="/calendario" >
            <Button _hover={{ bgColor: '#436fff33' }} variant="ghost" size="md" h={16} fontWeight={'normal'}>
              <LuCalendarClock /> Calendário
            </Button>
          </Link>

          <Link href="/minhas-reservas" >
            <Button _hover={{ bgColor: '#436fff33' }} variant="ghost" size="md" h={16} fontWeight={'normal'}>
              <LuCalendarDays /> Minhas Reservas
            </Button>
          </Link>

          {/* LINKS EXCLUSIVOS PARA ADMIN */}
          {isAdmin && (
            <>
              <Box w="1px" h="20px" bg="border.muted" alignSelf="center" mx={2} /> {/* Separador visual */}

              <Link href="/admin/dashboard" >
                <Button variant="ghost" size="md" h={16} colorPalette="purple">
                  <LuShieldCheck /> Aprovações
                </Button>
              </Link>

              <Link href="/admin/salas" >
                <Button variant="ghost" size="md" h={16} colorPalette="purple">
                  <LuLayoutDashboard /> Gerir Salas
                </Button>
              </Link>

              <Link href="/admin/usuarios" >
                <Button variant="ghost" size="md" h={16} colorPalette="purple">
                  <LuUsers /> Usuários
                </Button>
              </Link>
            </>
          )}
        </Stack>

        {/* Área do Usuário (Avatar e Logout) */}
        <Flex align="center" gap={4} >
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
                <Text fontSize="xs" color="fg.muted" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap" maxW={40}>
                  {session.user.email}
                </Text>
              </Box>

              <Avatar.Root bgColor={'blue.200'} size="sm" mr={8}>
                <Avatar.Fallback name={session.user.name || 'User'} />
                <Avatar.Image src={session.user.image || undefined} />
              </Avatar.Root>

              {/* Botão de Sair */}

              <button className="BtnLogout" onClick={() => signOut({ callbackUrl: '/login' })}>

                <div className="sign"><svg viewBox="0 0 512 512"><path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path></svg></div>

                <div className="text">Sair</div>
              </button>


            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}