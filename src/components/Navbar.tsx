'use client';

import { Box, Flex, Button, Link as ChakraLink, Stack, Container } from '@chakra-ui/react';
import { LuCalendarDays, LuLayoutDashboard, LuCalendarClock } from "react-icons/lu";

export default function Navbar() {
  return (
    <Box borderBottomWidth="1px" bg="bg.panel" position="sticky" top={0} zIndex={10}>
      <Container maxW="6xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo / Título */}
          <ChakraLink href="/"  _hover={{ textDecoration: 'none' }} fontSize="xl" fontWeight="bold">
              Mazzotini Rooms
          </ChakraLink>

          {/* Menu Desktop */}
          <Stack direction="row" gap={2}>
            <ChakraLink href="/">
              <Button variant="ghost" size="sm">
                <LuLayoutDashboard /> Salas
              </Button>
            </ChakraLink>
            
            <ChakraLink href="/calendario">
              <Button variant="ghost" size="sm">
                <LuCalendarClock /> Calendário
              </Button>
            </ChakraLink>

            <ChakraLink href="/minhas-reservas">
              <Button variant="ghost" size="sm">
                <LuCalendarDays /> Minhas Reservas
              </Button>
            </ChakraLink>
          </Stack>
        </Flex>
      </Container>
    </Box>
  );
}