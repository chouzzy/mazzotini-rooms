'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box, Flex, Heading, Text, Badge, Spinner,
  Card, Stack, Button, Separator, Center, Image,
  Link as ChakraLink
} from '@chakra-ui/react';
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

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) throw new Error('Falha ao buscar salas');
        const data = await res.json();
        // Filtra apenas as ativas e pega no máximo as 5 primeiras para o destaque
        const activeRooms = data.filter((r: Room) => r.isActive).slice(0, 5);
        setRooms(activeRooms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

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
        <Heading size="lg">Salas em Destaque</Heading>
        <Link href="/salas">
          <Button variant="ghost" colorPalette="blue" size="sm">
            Ver todas
          </Button>
        </Link>
      </Flex>

      {/* Container de Scroll Horizontal */}
      <Flex
        gap={6}
        overflowX="auto"
        pb={4}
        scrollSnapType="x mandatory"
        css={{
          '&::-webkit-scrollbar': { height: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
        }}
      >
        {rooms.map((room) => (
          <Box key={room.id} minW={{ base: "300px", md: "350px" }} scrollSnapAlign="start">
            <Card.Root variant="outline" overflow="hidden" h="full" _hover={{ shadow: 'md', transition: 'shadow 0.2s' }}>
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
                    <Button colorPalette="blue" flex="1" size="sm" onClick={() => handleBooking(room)}>
                      Reservar
                    </Button>
                  </Flex>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Box>
        ))}
      </Flex>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedRoom={selectedRoom}
        onSuccess={() => { }}
      />
    </Box>
  );
}