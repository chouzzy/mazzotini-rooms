'use client';

import { Box, Flex, Button, Link as ChakraLink, Stack, Container } from '@chakra-ui/react';
import Link from 'next/link';
import { LuCalendarDays, LuLayoutDashboard, LuCalendarClock } from "react-icons/lu";

export default function Navbar() {
  return (
    <Box borderBottomWidth="1px" bg="bg.panel" position="sticky" top={0} zIndex={10}>
      <Container maxW="6xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo / Título */}
          <Link href="/" passHref legacyBehavior>
            <ChakraLink _hover={{ textDecoration: 'none' }} fontSize="xl" fontWeight="bold">
              Mazzotini Rooms
            </ChakraLink>
          </Link>

          {/* Menu Desktop */}
          <Stack direction="row" gap={2}>
            <Link href="/" passHref legacyBehavior>
              <Button variant="ghost" size="sm">
                <LuLayoutDashboard /> Salas
              </Button>
            </Link>
            
            <Link href="/calendario" passHref legacyBehavior>
              <Button variant="ghost" size="sm">
                <LuCalendarClock /> Calendário
              </Button>
            </Link>

            <Link href="/minhas-reservas" passHref legacyBehavior>
              <Button variant="ghost" size="sm">
                <LuCalendarDays /> Minhas Reservas
              </Button>
            </Link>
          </Stack>
        </Flex>
      </Container>
    </Box>
  );
}