'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Box, Flex, Heading, Text, Badge, Spinner,
  Card, Stack, Button, Separator, Center, Image,
  Link as ChakraLink, IconButton
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import BookingModal from './BookingModal';

interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
  imageUrl?: string;
}

export default function RoomCarousel() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) throw new Error('Falha ao buscar salas');
        const data = await res.json();
        const activeRooms = data
          .filter((r: Room) => r.isActive)
          .sort((a: Room, b: Room) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
          .slice(0, 5);
        setRooms(activeRooms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 370;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleBooking = (room: Room) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  if (rooms.length === 0) return null;

  return (
    <Box mx='auto' maxW="8xl" position="relative" w="full">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size={{ base: 'md', md: 'lg' }}>Salas em Destaque</Heading>
        <Link href="/salas">
          <Button
            size="sm"
            bg="brand.800"
            color="white"
            px={5}
            borderRadius="full"
            _hover={{ bg: 'brand.600', transform: 'translateY(-1px)', shadow: 'md' }}
            transition="all 0.2s"
          >
            Ver todas as salas
          </Button>
        </Link>
      </Flex>

      {/* Wrapper com setas */}
      <Box position="relative" px={{ base: 0, md: 8 }}>

        {/* Seta esquerda */}
        <IconButton
          aria-label="Anterior"
          onClick={() => scroll('left')}
          position="absolute"
          left="-7"
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          borderRadius="full"
          bg="gray.900"
          color="brand.400"
          borderWidth="1px"
          borderColor="brand.700"
          shadow="md"
          size="md"
          _hover={{ bg: 'brand.800', color: 'white', borderColor: 'brand.600' }}
          transition="all 0.2s"
          display={{ base: 'none', md: 'flex' }}
        >
          <LuChevronLeft />
        </IconButton>

        {/* Container de Scroll Horizontal */}
        <Flex
          ref={scrollRef}
          gap={4}
          overflowX="auto"
          pb={4}
          scrollSnapType="x mandatory"
          css={{
            '&::-webkit-scrollbar': { height: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#C5A47E44', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#C5A47E' },
          }}
        >
          {rooms.map((room) => (
            <Box key={room.id} minW={{ base: "85vw", sm: "300px", md: "350px" }} scrollSnapAlign="start">
              <Card.Root variant="outline" overflow="hidden" h="full" _hover={{ shadow: 'lg', transform: 'translateY(-2px)', transition: 'all 0.2s' }}>
                <Link href={`/salas/${room.id}`} passHref>
                  <Box height="160px" bg="gray.100" position="relative" cursor="pointer">
                    {room.imageUrl ? (
                      <Image src={room.imageUrl} alt={room.name} objectFit="cover" w="full" h="full" />
                    ) : (
                      <Center h="full" color="gray.400" fontSize="sm">Sem Imagem</Center>
                    )}
                    <Badge position="absolute" top={2} right={2} colorPalette="green">Disponível</Badge>
                  </Box>
                </Link>

                <Card.Header pb={2}>
                  <ChakraLink href={`/salas/${room.id}`} _hover={{ textDecoration: 'none', color: 'blue.600' }}>
                    <Heading size="md" cursor="pointer" lineClamp={1}>{room.name}</Heading>
                  </ChakraLink>
                </Card.Header>

                <Card.Body>
                  <Stack gap={3}>
                    <Flex justify="space-between" fontSize="sm">
                      <Text color="fg.muted">Capacidade:</Text>
                      <Text fontWeight="medium">{room.capacity} Pessoas</Text>
                    </Flex>
                    <Text fontSize="sm" color="fg.muted" lineClamp={2} minH="40px">
                      {room.description || 'Sem descrição.'}
                    </Text>
                    <Separator />
                    <Flex gap={2}>
                      <Button
                        _hover={{ color: 'brand.50', bgColor: 'brand.900' }}
                        bgColor={'brand.800'}
                        color={'#FFFFFF'}
                        flex="1"
                        size="sm"
                        onClick={() => handleBooking(room)}
                      >
                        Reservar
                      </Button>
                    </Flex>
                  </Stack>
                </Card.Body>
              </Card.Root>
            </Box>
          ))}
        </Flex>

        {/* Seta direita */}
        <IconButton
          aria-label="Próxima"
          onClick={() => scroll('right')}
          position="absolute"
          right="-7"
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          borderRadius="full"
          bg="gray.900"
          color="brand.400"
          borderWidth="1px"
          borderColor="brand.700"
          shadow="md"
          size="md"
          _hover={{ bg: 'brand.800', color: 'white', borderColor: 'brand.600' }}
          transition="all 0.2s"
          display={{ base: 'none', md: 'flex' }}
        >
          <LuChevronRight />
        </IconButton>

      </Box>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedRoom={selectedRoom}
        onSuccess={() => { }}
      />
    </Box>
  );
}
