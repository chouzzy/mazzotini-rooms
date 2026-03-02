'use client';

import { Box, Container, SimpleGrid, Flex, Stack, Separator, Text, Link } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { LuMapPin, LuPhone, LuMail } from "react-icons/lu";

export function Footer() {

    const { data: session, status } = useSession();

    // Verifica se o usuário atual é um Administrador
    const isAdmin = session?.user?.role === 'ADMIN';

    return (
        <Flex bg="black" color="gray.300" py={12} p={8} w='100%' flexDir={'column'}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={10}>
                <Flex alignItems={'center'} justifyContent={'center'} flexDir={'column'} gap={1}>
                    <Link href="/" _hover={{ textDecoration: 'none' }} fontSize="xl" fontWeight="bold" color="blue.600" bgImage={isAdmin? 'url(/logo-admin.png)' : 'url(/logo.png)'} bgRepeat={'no-repeat'} bgSize={'contain'} bgPos={'center'}
                        h={24} w={40} />
                    <Text maxW="md" textAlign={'center'}>
                        Excelência e estrutura moderna para atender as necessidades dos nossos associados e clientes.
                    </Text>
                </Flex>
                <Stack gap={4} justify="center">
                    <Flex align="center" gap={3}>
                        <Box color="blue.400"><LuMapPin size={24} /></Box>
                        <Text>Av. Dr. Cardoso de Melo, 878 - 14º Andar - Vila Olímpia, São Paulo - SP, 04548-003</Text>
                    </Flex>
                    <Flex align="center" gap={3}>
                        <Box color="blue.400"><LuPhone size={24} /></Box>
                        <Text>(11) 5599-4199</Text>
                    </Flex>
                    <Flex align="center" gap={3}>
                        <Box color="blue.400"><LuMail size={24} /></Box>
                        <Text>reuniao@mazzotiniadvogados.com.br</Text>
                    </Flex>
                </Stack>
            </SimpleGrid>

            <Separator borderColor="gray.700" my={8} />

            <Text textAlign="center" fontSize="sm" color="gray.500">
                © {new Date().getFullYear()} Mazzotini Rooms. Todos os direitos reservados.
            </Text>
        </Flex>
    )
}