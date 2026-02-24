'use client';
import { Box, Stack, Flex, Icon, Heading, Text, Image } from "@chakra-ui/react";
import { LuSparkles, LuCalendarCheck, LuVideo } from "react-icons/lu";
import { ArrowCircleDownIcon } from "@phosphor-icons/react";

export function Welcome() {
    return (

        <Box
            py={8}
            mb={10}
            position="relative"
            overflow="hidden"
        >
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

            <Flex gap={6} zIndex={1} justifyContent={'space-between'}>
                <Flex flexDir={'column'} align="start" gap={4}>
                    <Flex align="center" gap={3} bgColor={'yellow.500'}
                        bgGradient="to-r"
                        gradientFrom="blue.500"
                        gradientTo="blue.600"
                        px={2}
                        py={1} borderRadius="md"
                    >
                        <Icon as={LuSparkles} fontSize="2xl" color="yellow.400" />
                        <Text fontWeight="semibold" letterSpacing="widest" textTransform="uppercase" fontSize="sm" color={'white'}>
                            Sistema de Agendamento
                        </Text>
                    </Flex>

                    <Flex flexDir={'column'} maxW="4xl" fontWeight={'semibold'} lineHeight="1.1" letterSpacing={1.4} color={'textPrimary'}>
                        <Text fontSize="6xl">Agende sua reunião no</Text>
                        <Text color={'blue.500'} fontSize="6xl">Mazzotini Rooms 👋</Text>
                    </Flex>

                    <Text fontSize="md" maxW="3xl" lineHeight="tall" color={'textPrimary'}>
                        Encontre e reserve o espaço ideal para suas reuniões, workshops ou momentos de foco.
                        Acompanhe a disponibilidade em tempo real e integre automaticamente com o Microsoft Teams.
                    </Text>

                    <Flex gap={6} mt={2} flexWrap="wrap">
                        <Flex color='white' bgColor={'blue.500'} align="center" gap={2} border={'1px solid'} cursor={'pointer'} borderColor="blue.500" px={3} py={2} borderRadius="md" _hover={{ bgColor: 'blue.600', transition: '600ms' }}>
                            <Icon as={ArrowCircleDownIcon} fontSize={'xl'} color="blue.200" />
                            <Text fontSize="md">Reserve agora</Text>
                        </Flex>
                    </Flex>
                    {/* <Flex gap={6} mt={2} flexWrap="wrap">
                        <Flex color='white' bgColor={'green.500'} align="center" gap={2} border={'1px solid'} cursor={'pointer'} borderColor="green.500" px={3} py={2} borderRadius="md" _hover={{ bgColor: 'green.600', transition: '600ms' }}>
                            <Icon as={LuCalendarCheck} color="green.200" />
                            <Text fontSize="md">Reserva Instantânea</Text>
                        </Flex>
                        <Flex color='white' bgColor={'purple.500'} align="center" gap={2} border={'1px solid'} cursor={'pointer'} borderColor="purple.500" px={3} py={2} borderRadius="md" _hover={{ bgColor: 'purple.600', transition: '600ms' }}>
                            <Icon as={LuVideo} color="purple.200" />
                            <Text fontSize="md">Link Automático do Teams</Text>
                        </Flex>
                    </Flex> */}
                </Flex>
                <Flex>
                    <Image src={'logo-rm-bg.png'} alt="Ilustração de Boas-Vindas" maxW="400px" objectFit="contain" />
                </Flex>
            </Flex>
        </Box >
    )
}