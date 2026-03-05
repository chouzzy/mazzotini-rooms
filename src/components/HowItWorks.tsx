'use client';

import { Box, Container, Stack, Heading, SimpleGrid, Card, Icon, Text, Flex } from "@chakra-ui/react";
import { MagnifyingGlassIcon, ClockAfternoonIcon, CheckCircleIcon } from "@phosphor-icons/react";


export default function HowItWorks() {
    return (

        <Flex flexDir={'column'} w='100%'>
            <Box
                position="relative"
                py={24}
                overflow="hidden"
                bgGradient="to-b"
                gradientFrom="blue.600"
                gradientTo="blue.800"
            >
                {/* Luzes de Fundo Desfocadas (Glow Effect) */}
                <Box position="absolute" top="-10%" left="-5%" w="300px" h="300px" bg="blue.400" borderRadius="full" filter="blur(120px)" opacity={0.4} />
                <Box position="absolute" bottom="-10%" right="-5%" w="300px" h="300px" bg="blue.600" borderRadius="full" filter="blur(120px)" opacity={0.3} />

                <Container maxW="6xl" position="relative" zIndex={1}>
                    <Stack textAlign="center" mb={16} gap={4}>
                        <Heading size="3xl" color="white" fontWeight="bold" letterSpacing="tight">
                            Como funciona?
                        </Heading>
                        <Text color="blue.100" fontSize="lg" maxW="2xl" mx="auto">
                            Reservar um espaço no Mazzotini Rooms é simples, rápido e totalmente integrado à sua agenda corporativa.
                        </Text>
                    </Stack>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                        {/* Card 1 */}
                        <Card.Root
                            bg="whiteAlpha.100"
                            backdropFilter="blur(16px)"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            alignItems="center"
                            textAlign="center"
                            p={8}
                            borderRadius="2xl"
                            transition="all 0.3s ease"
                            _hover={{ transform: 'translateY(-8px)', shadow: '2xl', borderColor: 'blue.400', bg: 'whiteAlpha.200' }}
                        >
                            <Box p={4} bg="whiteAlpha.800" color="blue.600" borderRadius="2xl" mb={6} shadow="inner">
                                <Icon as={MagnifyingGlassIcon} fontSize="5xl" />
                            </Box>
                            <Heading size="lg" mb={3} color="white">1. Escolha a Sala</Heading>
                            <Text color="blue.100" lineHeight="tall">
                                Navegue pelas opções disponíveis e encontre o ambiente perfeito para a capacidade da sua reunião.
                            </Text>
                        </Card.Root>

                        {/* Card 2 */}
                        <Card.Root
                            bg="whiteAlpha.100"
                            backdropFilter="blur(16px)"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            alignItems="center"
                            textAlign="center"
                            p={8}
                            borderRadius="2xl"
                            transition="all 0.3s ease"
                            _hover={{ transform: 'translateY(-8px)', shadow: '2xl', borderColor: 'brand.400', bg: 'whiteAlpha.200' }}
                        >
                            <Box p={4} bg="whiteAlpha.800" color="brand.600" borderRadius="2xl" mb={6} shadow="inner">
                                <Icon as={ClockAfternoonIcon} fontSize="5xl" />
                            </Box>
                            <Heading size="lg" mb={3} color="white">2. Defina o Horário</Heading>
                            <Text color="blue.100" lineHeight="tall">
                                Selecione a data e o período desejado. O sistema verifica a disponibilidade instantaneamente.
                            </Text>
                        </Card.Root>

                        {/* Card 3 */}
                        <Card.Root
                            bg="whiteAlpha.100"
                            backdropFilter="blur(16px)"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            alignItems="center"
                            textAlign="center"
                            p={8}
                            borderRadius="2xl"
                            transition="all 0.3s ease"
                            _hover={{ transform: 'translateY(-8px)', shadow: '2xl', borderColor: 'teal.400', bg: 'whiteAlpha.200' }}
                        >
                            <Box p={4} bg="whiteAlpha.800" color="teal.600" borderRadius="2xl" mb={6} shadow="inner">
                                <Icon as={CheckCircleIcon} fontSize="5xl" />
                            </Box>
                            <Heading size="lg" mb={3} color="white">3. Confirmação</Heading>
                            <Text color="blue.100" lineHeight="tall">
                                Após a aprovação, você recebe um e-mail de confirmação já com o link do Microsoft Teams gerado.
                            </Text>
                        </Card.Root>
                    </SimpleGrid>
                </Container>
            </Box>
        </Flex>
    )
}