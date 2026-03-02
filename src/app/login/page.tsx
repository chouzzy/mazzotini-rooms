'use client';

import { Suspense } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Stack,
  Center,
  Card,
  Image,
  Spinner
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { LuLogIn } from "react-icons/lu";

// 1. Extraímos a lógica que usa o "useSearchParams" para um componente isolado
function LoginButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleLogin = () => {
    signIn('azure-ad', { callbackUrl });
  };

  return (
    <Button
      size="xl"
      colorPalette="blue"
      width="full"
      onClick={handleLogin}
      borderRadius="lg"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 23 23"
        width="20"
        height="20"
        style={{ marginRight: '10px' }}
      >
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      </svg>
      Entrar com Microsoft 365
    </Button>
  );
}

// 2. A página principal agora renderiza o botão envolvido no Suspense
export default function LoginPage() {
  return (
    <Box minH="100vh" bg="bg.canvas" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <Card.Root variant="elevated" size="lg" shadow="xl" borderRadius="2xl">
          <Card.Body gap={8} p={8}>
            <Center flexDirection="column" gap={4}>
              <Image src={"/logo.png"} alt="Mazzotini Rooms Logo" mx="auto" maxW={24} />

              <Box bg="blue.600" p={4} borderRadius="full" color="white" shadow="md">
                <LuLogIn size={32} />
              </Box>

              <Stack gap={1} textAlign="center">
                <Heading size="2xl">Bem-vindo</Heading>
                <Text color="fg.muted">Sistema de Reservas Mazzotini</Text>
              </Stack>
            </Center>

            <Stack gap={4} mt={4}>
              <Text fontSize="sm" textAlign="center" color="fg.muted">
                Utilize sua conta corporativa para acessar.
              </Text>

              {/* AQUI ESTÁ A MÁGICA: O Suspense resolve o erro do Vercel */}
              <Suspense fallback={<Center><Spinner size="md" color="blue.500" /></Center>}>
                <LoginButton />
              </Suspense>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Text mt={8} textAlign="center" fontSize="xs" color="fg.muted">
          © {new Date().getFullYear()} Mazzotini Rooms. Acesso restrito.
        </Text>
      </Container>
    </Box>
  );
}