'use client';

import { useEffect, useState } from 'react';
import { 
  Box, 
  SimpleGrid, 
  Heading, 
  Text, 
  Badge, 
  Spinner, 
  Alert, 
  Card,
  Stack,
  Button,
  Separator,
  Center,
  Image,
  Flex,
  Link as ChakraLink, // Renomeado para evitar conflito
  Link
} from '@chakra-ui/react';
import { LuPlus } from "react-icons/lu";
import BookingModal from './BookingModal';
import AdminRoomModal from './AdminRoomModal';

interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
  imageUrl?: string; 
}

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modais
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error('Falha ao buscar salas');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      setError('Erro ao carregar as salas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleBooking = (room: Room) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  if (loading) {
    return (
      <Center py={10} flexDirection="column" gap={4}>
        <Spinner size="xl" color="blue.500" />
        <Text>Carregando salas...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" mt={4}>
        <Alert.Indicator />
        <Alert.Title>{error}</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <Box mt={8} position="relative">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Salas Disponíveis</Heading>
        <Button size="sm" variant="outline" onClick={() => setIsAdminOpen(true)}>
          <LuPlus /> Nova Sala
        </Button>
      </Flex>
      
      {rooms.length === 0 ? (
        <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
          <Text fontSize="lg" color="gray.600">Nenhuma sala cadastrada.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {rooms.map((room) => (
            <Card.Root key={room.id} variant="outline" overflow="hidden" _hover={{ shadow: 'md', transition: 'shadow 0.2s' }}>
              {/* Imagem de Capa com Link */}
              <Link href={`/salas/${room.id}`} >
                <Box height="160px" bg="gray.100" position="relative" cursor="pointer">
                  {room.imageUrl ? (
                    <Image src={room.imageUrl} alt={room.name} objectFit="cover" w="full" h="full" />
                  ) : (
                    <Center h="full" color="gray.400" fontSize="sm">
                      Sem Imagem
                    </Center>
                  )}
                  <Badge 
                    position="absolute" 
                    top={2} 
                    right={2} 
                    colorPalette={room.isActive ? 'green' : 'red'}
                  >
                    {room.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </Box>
              </Link>

              <Card.Header pb={2}>
                <Link href={`/salas/${room.id}`} >
                  <ChakraLink _hover={{ textDecoration: 'none', color: 'blue.600' }}>
                    <Heading size="md" cursor="pointer">{room.name}</Heading>
                  </ChakraLink>
                </Link>
              </Card.Header>

              <Card.Body>
                <Stack gap={3}>
                  <Flex justify="space-between" fontSize="sm">
                    <Text color="fg.muted">Capacidade:</Text>
                    <Text fontWeight="medium">{room.capacity} Pessoas</Text>
                  </Flex>
                  
                  <Text fontSize="sm" color="fg.muted" lineClamp={2} minH="40px">
                    {room.description || 'Sem descrição disponível.'}
                  </Text>
                  
                  <Separator />
                  
                  <Flex gap={2}>
                    {/* Botão Ver Detalhes */}
                    <Link href={`/salas/${room.id}`} >
                      <Button variant="outline" flex="1" size="sm">
                        Detalhes
                      </Button>
                    </Link>

                    {/* Botão Reservar */}
                    <Button 
                      colorPalette="blue" 
                      flex="1"
                      size="sm"
                      onClick={() => handleBooking(room)}
                      disabled={!room.isActive}
                    >
                      Reservar
                    </Button>
                  </Flex>
                </Stack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        selectedRoom={selectedRoom} 
        onSuccess={() => {}}
      />

      <AdminRoomModal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onSuccess={fetchRooms} 
      />
    </Box>
  );
}