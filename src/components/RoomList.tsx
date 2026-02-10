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
  Center
} from '@chakra-ui/react';
import BookingModal from './BookingModal';

interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
}

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Controle do Modal (UseState padrão já que useDisclosure pode não estar disponível ou ser diferente dependendo da config do v3)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error('Falha ao buscar salas');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      setError('Erro ao carregar as salas. Tente novamente mais tarde.');
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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

  if (rooms.length === 0) {
    return (
      <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
        <Text fontSize="lg" color="gray.600">Nenhuma sala encontrada.</Text>
      </Box>
    );
  }

  return (
    <Box mt={8}>
      <Heading size="md" mb={6}>Salas Disponíveis</Heading>
      
      {/* SimpleGrid continua existindo, mas properties podem variar. 
          minChildWidth ou columns funcionam bem. */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {rooms.map((room) => (
          // Card v3 usa sintaxe composta: Card.Root, Card.Header, etc.
          <Card.Root key={room.id} variant="outline" _hover={{ shadow: 'md', transition: 'shadow 0.2s' }}>
            <Card.Header>
              <Stack direction="row" justify="space-between" align="center">
                <Heading size="md">{room.name}</Heading>
                {/* colorScheme mudou para colorPalette no v3 */}
                <Badge colorPalette={room.isActive ? 'green' : 'red'}>
                  {room.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </Stack>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Box>
                  <Heading size='xs' textTransform='uppercase' color="fg.muted">
                    Capacidade
                  </Heading>
                  <Text pt='1' fontSize='sm'>
                    {room.capacity} Pessoas
                  </Text>
                </Box>
                
                {/* StackDivider foi removido em favor do componente Separator */}
                <Separator />
                
                <Box>
                  <Heading size='xs' textTransform='uppercase' color="fg.muted">
                    Descrição
                  </Heading>
                  <Text pt='1' fontSize='sm'>
                    {room.description || 'Sem descrição'}
                  </Text>
                </Box>
                
                {/* Botão de Reservar */}
                <Button 
                  colorPalette="blue" 
                  width="full" 
                  mt={4}
                  onClick={() => handleBooking(room)}
                  disabled={!room.isActive}
                >
                  Reservar
                </Button>
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      {/* Modal de Agendamento */}
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        selectedRoom={selectedRoom} 
        onSuccess={() => {
            // Recarrega ou apenas fecha
        }}
      />
    </Box>
  );
}