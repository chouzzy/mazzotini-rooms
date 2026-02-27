// src/app/layout.tsx
import { Flex } from "@chakra-ui/react";
import { Providers } from "./providers";
import HowItWorks from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          <Flex flexDir={'column'} minH="100vh" bg="bg.canvas" w='100%' alignItems={'center'} justifyContent={'space-between'} gap={8} minHeight={'100vh'}>
            <Navbar />
            {children}

            <Footer />
          </Flex>
        </Providers>
      </body>
    </html>
  );
}