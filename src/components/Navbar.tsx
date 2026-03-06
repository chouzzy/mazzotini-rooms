'use client';

import { useState } from 'react';
import { Box, Flex, Button, Link, Stack, Text, Avatar, IconButton } from '@chakra-ui/react';
import {
  LuCalendarDays, LuLayoutDashboard, LuCalendarClock,
  LuShieldCheck, LuUsers, LuDoorOpen, LuMenu, LuX,
  LuLogOut
} from "react-icons/lu";
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  
  // Estado para controlar o menu no celular
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMenu = () => setIsMobileOpen(false);

  // Componente que renderiza os links comuns
  const PublicLinks = () => (
    <>
      <Link href="/salas" onClick={closeMenu}>
        <Button _hover={{ bgColor: 'gray.700' }} variant="ghost" size="md" h={{ base: 12, lg: 16 }} w="full" justifyContent={{ base: "flex-start", lg: "center" }} fontWeight="normal">
          <LuDoorOpen /> Salas
        </Button>
      </Link>
      <Link href="/calendario" onClick={closeMenu}>
        <Button _hover={{ bgColor: 'gray.700' }} variant="ghost" size="md" h={{ base: 12, lg: 16 }} w="full" justifyContent={{ base: "flex-start", lg: "center" }} fontWeight="normal">
          <LuCalendarClock /> Calendário
        </Button>
      </Link>
      <Link href="/minhas-reservas" onClick={closeMenu}>
        <Button _hover={{ bgColor: 'gray.700' }} variant="ghost" size="md" h={{ base: 12, lg: 16 }} w="full" justifyContent={{ base: "flex-start", lg: "center" }} fontWeight="normal">
          <LuCalendarDays /> Minhas Reservas
        </Button>
      </Link>
    </>
  );

  // Componente que renderiza os links de Admin
  const AdminLinks = () => (
    <>
      <Link href="/admin/dashboard" onClick={closeMenu}>
        <Button variant="ghost" size="md" h={{ base: 12, lg: 16 }} w="full" justifyContent={{ base: "flex-start", lg: "center" }} color={'purple.500'} _hover={{ bgColor: 'purple.800', color:'purple.100' }}>
          <LuShieldCheck /> Aprovações
        </Button>
      </Link>
      <Link href="/admin/salas" onClick={closeMenu}>
        <Button variant="ghost" size="md" h={{ base: 12, lg: 16 }} w="full" justifyContent={{ base: "flex-start", lg: "center" }} color={'purple.500'} _hover={{ bgColor: 'purple.800', color:'purple.100' }}>
          <LuLayoutDashboard /> Gerir Salas
        </Button>
      </Link>
      <Link href="/admin/usuarios" onClick={closeMenu}>
        <Button variant="ghost" size="md" h={{ base: 12, lg: 16 }} w="full" justifyContent={{ base: "flex-start", lg: "center" }} color={'purple.500'} _hover={{ bgColor: 'purple.800', color:'purple.100' }}  >
          <LuUsers /> Usuários
        </Button>
      </Link>
    </>
  );

  return (
    <Box 
      borderBottomWidth="1px" 
      borderColor={'#6A623266'}
      bgGradient="to-t" 
      bgColor={'black'}
      gradientFrom="#B8A76E10"
      gradientTo="#0b0b0b"
      position="sticky" 
      top={0} 
      zIndex={50} 
      w="100%"
    >
      <Flex alignItems="center" justifyContent="space-between" w="100%" px={{ base: 4, md: 8 }}>
      
      {/* Logo / Título */}
      <Link 
      href="/" 
      _hover={{ textDecoration: 'none' }} 
      fontSize="xl" 
      fontWeight="bold" 
      color="blue.600" 
      bgImage={isAdmin ? 'url(/logo-admin.png)' : 'url(/logo.png)'} 
      bgRepeat="no-repeat" 
      bgSize="contain" 
      bgPos="center"
      minW={28} 
      h={16} 
      my={2} 
      />

      {/* Menu Principal (Desktop) - Só mostra em telas grandes (lg) para não quebrar botões */}
      <Stack direction="row" gap={2} display={{ base: 'none', lg: 'flex' }} position="absolute" left="50%" transform="translateX(-50%)">
      <PublicLinks />
      {isAdmin && (
      <>
        <Box w="1px" h="20px" bg="border.muted" alignSelf="center" mx={2} />
        <AdminLinks />
      </>
      )}
      </Stack>

      {/* Área do Usuário + Hamburger Menu (Direita) */}
      <Flex align="center" gap={4}>
      {status === 'authenticated' && session?.user && (
      <Flex align="center" gap={3}>
        <Box textAlign="left">
        <Flex align="center" gap={2} justify="flex-end">
        <Text fontSize="sm" fontWeight="medium" lineHeight="1.2" display={{ base: 'none', sm: 'block' }}>
        {session.user.name}
        </Text>
        {isAdmin && (
        <Box px={1.5} py={0.5} bg="purple.700" color="purple.100" fontSize="2xs" fontWeight="bold" borderRadius="sm">
          ADMIN
        </Box>
        )}
        
        </Flex>
        <Text fontSize="xs" color="fg.muted" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap" maxW={40} display={{ base: 'none', sm: 'block' }}>
        {session.user.email}
        </Text>
        </Box>

        <Avatar.Root bgColor={isAdmin ? 'purple.700' : 'brand.700'} size="sm" mr={{ base: 0, lg: 8 }}>
        <Avatar.Fallback name={session.user.name || 'User'} />
        <Avatar.Image src={session.user.image || undefined} />
        </Avatar.Root>
        

        {/* O seu botão de Sair Animado (Oculto no celular por espaço, renderizado dentro do menu no mobile) */}
        <Box display={{ base: 'none', lg: 'block' }}>
        <button className="BtnLogout" onClick={() => signOut({ callbackUrl: '/login' })}>
        <div className="sign">
        <svg viewBox="0 0 512 512"><path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path></svg>
        </div>
        <div className="text">Sair</div>
        </button>
        </Box>

        {/* Botão Hambúrguer (Apenas Mobile/Tablet) */}
        <Button 
        display={{ base: 'flex', lg: 'none' }} 
        variant="ghost" 
        size="sm"
        px={2}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
        {isMobileOpen ? <LuX size={24} /> : <LuMenu size={24} />}
        </Button>

      </Flex>
      )}
      </Flex>
      </Flex>

      {/* Menu Suspenso (Dropdown) para Mobile */}
      {isMobileOpen && (
      <Box 
      display={{ base: 'block', lg: 'none' }} 
      bgGradient="to-b"
      gradientFrom="#1a1a1a"
      gradientTo="#0d0d0d"
      position="absolute" 
      top="100%" 
      left={0} 
      w="full" 
      shadow="lg" 
      borderBottomWidth="1px"
      p={4}
      >
      <Stack gap={2}>
      <PublicLinks />
      
      {isAdmin && (
        <>
        <Box h="1px" w="full" bg="border.muted" my={2} />
        <Text fontSize="xs" fontWeight="bold" color="brand.600" textTransform="uppercase" ml={4}>
        Administração
        </Text>
        <AdminLinks />
        </>
      )}

      <Box h="1px" w="full" bg="border.muted" my={2} />
      
      <Button 
        colorPalette="red" 
        variant="outline" 
        w="full" 
        justifyContent="flex-start"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        <LuLogOut /> Sair do Sistema
      </Button>
      </Stack>
      </Box>
      )}
    </Box>
  );
}