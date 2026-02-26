'use client';

import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  Stack, 
  Center,
  Card
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { LuLogIn } from "react-icons/lu";

export default function LoginPage() {
  const searchParams = useSearchParams();
  // Se o usuário tentou acessar uma rota (ex: /calendario), guardamos para redirecionar depois
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleLogin = () => {
    // Inicia o fluxo do Azure AD (Microsoft 365)
    signIn('azure-ad', { callbackUrl });
  };

  return (
    <Box minH="100vh" bg="bg.canvas" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <Card.Root variant="elevated" size="lg" shadow="xl" borderRadius="2xl">
          <Card.Body gap={8} p={8}>
            <Center flexDirection="column" gap={4}>
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

              <Button 
                size="xl" 
                colorPalette="blue" 
                width="full" 
                onClick={handleLogin}
                borderRadius="lg"
              >
                {/* Ícone vetorizado da Microsoft */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 23 23" 
                  width="20" 
                  height="20" 
                  style={{ marginRight: '10px' }}
                >
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Entrar com Microsoft 365
              </Button>
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