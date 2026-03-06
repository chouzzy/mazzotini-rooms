'use client';

import { usePathname } from 'next/navigation';
import { Flex } from '@chakra-ui/react';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import WhatsButton from '@/components/WhatsButton';
// import Footer from '@/components/Footer'; (Assumindo que você tem o import)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Hook nativo do Next.js para pegar a rota atual (funciona no SSR e no Cliente)
  const pathname = usePathname();

  // Verifica se a rota atual inclui '/login'. O '?' previne erros caso pathname venha null no primeiro render
  const isLoginPage = pathname?.includes('/login');

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          <Flex
            flexDir="column"
            minH="100vh"
            bg="bg.canvas"
            w="100%"
            alignItems="center"
            justifyContent="space-between"
            gap={8}
            color={'fg.DEFAULT'}
          >
            {/* Renderiza Navbar apenas se NÃO for a página de login */}
            {!isLoginPage && <Navbar />}

            {children}
            <WhatsButton />
            {/* Renderiza Footer apenas se NÃO for a página de login */}
            {!isLoginPage && <Footer />}
          </Flex>
        </Providers>
      </body>
    </html>
  );
}