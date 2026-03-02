'use client';

import { Box, Stack, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuLayoutDashboard, LuShieldCheck, LuUsers, LuArrowLeft, LuMenu, LuX } from "react-icons/lu";
import { useState } from 'react';

export function AdminSidebar() {
  const pathname = usePathname();
  // Estado para controlar se o menu está aberto no Mobile
  const [isOpen, setIsOpen] = useState(false);

  // Criamos uma função para fechar o menu ao clicar num link (apenas no mobile)
  const handleLinkClick = () => setIsOpen(false);

  return (
    <>
      {/* 1. BOTÃO FLUTUANTE (Visível Apenas no Mobile) */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        bottom={6}
        right={6}
        zIndex={50}
      >
        <Button
          colorPalette="purple"
          size="lg"
          borderRadius="full"
          shadow="2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <LuX /> : <LuMenu />} 
          {isOpen ? 'Fechar' : 'Menu Admin'}
        </Button>
      </Box>

      {/* 2. OVERLAY ESCURO (Apenas Mobile quando aberto) */}
      {isOpen && (
        <Box
          display={{ base: 'block', md: 'none' }}
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={30}
          backdropFilter="blur(2px)"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. A BARRA LATERAL EM SI */}
      <Box 
        w="250px" 
        bg="white" 
        // No desktop ela desconta a Navbar (64px). No mobile pega a tela toda.
        h={{ base: '100vh', md: 'calc(100vh - 64px)' }} 
        position="fixed" 
        // A Mágica: No mobile ela fica escondida (-260px). Se isOpen for true, vai para 0.
        left={{ base: isOpen ? 0 : '-260px', md: 0 }} 
        top={{ base: 0, md: '64px' }} 
        borderRightWidth="1px" 
        p={4}
        display="flex"
        flexDirection="column"
        transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={40}
        shadow={{ base: '2xl', md: 'none' }}
      >

        <Stack gap={2} flex={1} mt={{ base: 8, md: 0 }}>
          <Link href="/admin/dashboard" passHref legacyBehavior>
            <Button 
              as="a"
              variant={pathname === '/admin/dashboard' ? 'solid' : 'ghost'} 
              colorPalette="purple" 
              justifyContent="flex-start" 
              w="full"
              onClick={handleLinkClick}
            >
              <LuShieldCheck /> Aprovações
            </Button>
          </Link>

          <Link href="/admin/salas" passHref legacyBehavior>
            <Button 
              as="a"
              variant={pathname === '/admin/salas' ? 'solid' : 'ghost'} 
              colorPalette="purple" 
              justifyContent="flex-start" 
              w="full"
              onClick={handleLinkClick}
            >
              <LuLayoutDashboard /> Gerir Salas
            </Button>
          </Link>

          <Link href="/admin/usuarios" passHref legacyBehavior>
            <Button 
              as="a"
              variant={pathname === '/admin/usuarios' ? 'solid' : 'ghost'} 
              colorPalette="purple" 
              justifyContent="flex-start" 
              w="full"
              onClick={handleLinkClick}
            >
              <LuUsers /> Usuários
            </Button>
          </Link>
        </Stack>

        {/* Botão para voltar ao site normal */}
        <Box mt="auto" pt={4} borderTopWidth="1px">
          <Link href="/" passHref legacyBehavior>
            <Button as="a" variant="outline" w="full" colorPalette="gray" justifyContent="flex-start">
              <LuArrowLeft /> Voltar ao Site
            </Button>
          </Link>
        </Box>
      </Box>
    </>
  );
}