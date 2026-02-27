'use client';

import { Box, Stack, Flex, Icon, Heading, Text, Image, Link } from "@chakra-ui/react";
import { LuSparkles } from "react-icons/lu";
import { ArrowCircleDownIcon } from "@phosphor-icons/react";

export function Welcome() {
    return (
        <Flex
            maxW="8xl"
            w='100%'
            mt={12}
            position="relative"
            overflow="hidden"
            flexDir="column"
            alignItems="center"
            justifyContent="space-between"
        >
            {/* Efeito de luz de fundo (Blur) */}
            <Box
                position="absolute"
                top="-20%"
                right="-5%"
                w="300px"
                h="300px"
                bg="whiteAlpha.100"
                borderRadius="full"
                filter="blur(40px)"
            />

            <Flex
                gap={{ base: 10, lg: 6 }}
                w="100%"
                zIndex={1}
                justifyContent="space-between"
                alignItems="center"
                direction={{ base: 'column', lg: 'row' }} // Empilha no celular, lado a lado no PC
            >
                {/* LADO ESQUERDO: TEXTOS E BOTÃO */}
                <Flex flexDir="column" align="start" justifyContent="center" gap={6}>
                    <Flex
                        align="center"
                        gap={3}
                        bgGradient="to-r"
                        gradientFrom="blue.500"
                        gradientTo="blue.600"
                        px={3}
                        py={1.5}
                        borderRadius="md"
                        shadow="sm"
                    >
                        <Icon as={LuSparkles} fontSize="xl" color="yellow.400" />
                        <Text fontWeight="bold" letterSpacing="widest" textTransform="uppercase" fontSize="xs" color="white">
                            Sistema de Agendamento
                        </Text>
                    </Flex>

                    <Flex flexDir="column" fontWeight="semibold" lineHeight="1.1" letterSpacing="tight" color="gray.800">
                        <Text fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}>Agende sua reunião no</Text>
                        <Text color="blue.500" fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}>Mazzotini Rooms 👋</Text>
                    </Flex>

                    <Text fontSize={{ base: "md", md: "lg" }} maxW="lg" lineHeight="tall" color="gray.600">
                        Encontre e reserve o espaço ideal para suas reuniões, workshops ou momentos de foco.
                        Acompanhe a disponibilidade em tempo real e integre automaticamente com o Microsoft Teams.
                    </Text>

                    <Flex mt={2} pl={2}>
                        <Link href="/salas" >
                            {/* <Flex
                                color="white"
                                bg="blue.500"
                                align="center"
                                gap={2}
                                px={5}
                                py={3}
                                borderRadius="lg"
                                cursor="pointer"
                                shadow="md"
                                _hover={{ bg: 'blue.600', transform: 'translateY(-2px)', shadow: 'lg' }}
                                transition="all 0.3s ease"
                            >
                                <Icon as={ArrowCircleDownIcon} fontSize="xl" color="blue.100" />
                                <Text fontSize="md" fontWeight="medium">Reserve agora</Text>
                            </Flex> */}
                            <button className="buttonReserveAgora">
                                Reserve agora
                                <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </button>

                        </Link>
                    </Flex>
                </Flex>

                {/* LADO DIREITO: IMAGEM COM CORTE DIAGONAL */}
                <Flex
                    w={{ base: "100%", lg: "50%" }}
                    justify={{ base: "center", lg: "flex-end" }}
                    h={{ base: "200px", md: "300px", lg: "500px" }}
                >
                    <Box
                        w="full"
                        maxW="600px"
                        borderRadius="2xl"
                        h='100%'
                        overflow="hidden"
                        // Aqui acontece a mágica do corte! 
                        // Desenha um polígono ignorando os primeiros 10% da esquerda no topo.
                        clipPath="polygon(10% 0, 100% 0, 100% 100%, 0% 100%)"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1579488081757-b212dbd6ee72?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Ilustração de Boas-Vindas"
                            w="full"
                            h="full"
                            objectFit="cover" // Importante: cover faz a imagem preencher todo o polígono
                            transition="transform 0.5s ease"
                            _hover={{ transform: "scale(1.05)" }} // Dá um zoom charmoso ao passar o mouse
                        />
                    </Box>
                </Flex>
            </Flex>
        </Flex>
    );
}