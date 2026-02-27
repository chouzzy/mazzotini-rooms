'use client';

import { Box, Stack, Button, Text, Flex } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuLayoutDashboard, LuShieldCheck, LuUsers, LuArrowLeft } from "react-icons/lu";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Box 
      w="250px" 
      bg="white" 
      h="100vh" 
      position="fixed" 
      left={0} 
      top={24} 
      borderRightWidth="1px" 
      p={4}
      display="flex"
      flexDirection="column"
    >

      <Stack gap={2} flex={1}>
        <Link href="/admin/dashboard" >
          <Button 
            variant={pathname === '/admin/dashboard' ? 'solid' : 'ghost'} 
            colorPalette="purple" 
            justifyContent="flex-start" 
            w="full"
          >
            <LuShieldCheck /> Aprovações
          </Button>
        </Link>

        <Link href="/admin/salas" >
          <Button 
            variant={pathname === '/admin/salas' ? 'solid' : 'ghost'} 
            colorPalette="purple" 
            justifyContent="flex-start" 
            w="full"
          >
            <LuLayoutDashboard /> Gerir Salas
          </Button>
        </Link>

        <Link href="/admin/usuarios" >
          <Button 
            variant={pathname === '/admin/usuarios' ? 'solid' : 'ghost'} 
            colorPalette="purple" 
            justifyContent="flex-start" 
            w="full"
          >
            <LuUsers /> Usuários
          </Button>
        </Link>
      </Stack>

      {/* Botão para voltar ao site normal */}
      <Box mt="auto" pt={4} borderTopWidth="1px">
        <Link href="/" >
          <Button variant="outline" w="full" colorPalette="gray" justifyContent="flex-start">
            <LuArrowLeft /> Voltar ao Site
          </Button>
        </Link>
      </Box>
    </Box>
  );
}