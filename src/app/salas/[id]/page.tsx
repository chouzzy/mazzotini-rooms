'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Image, 
  Badge, 
  Button, 
  Flex, 
  Stack, 
  Spinner, 
  Center,
  Separator,
  Grid,
  Card,
  Icon
} from '@chakra-ui/react';
import { 
  LuUsers, 
  LuWifi, 
  LuMonitor, 
  LuCoffee, 
  LuArrowLeft, 
  LuCalendarCheck, 
  LuPresentation,
  LuVideo,
  LuAccessibility,
  LuCheck
} from "react-icons/lu";
import BookingModal from '@/components/BookingModal';

interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
  imageUrl?: string;
  amenities?: string[];
}

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal de Agendamento
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${params.id}`);
        if (!res.ok) throw new Error('Sala não encontrada');
        const data = await res.json();
        setRoom(data);
      } catch (error) {
        console.error(error);
        // Se der erro, volta pra home (opcional)
        // router.push('/'); 
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRoom();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Box minH="100vh" bg="bg.canvas">
        <Center h="calc(100vh - 64px)">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </Box>
    );
  }

  if (!room) {
    return (
      <Box minH="100vh" bg="bg.canvas">
        <Center h="calc(100vh - 64px)">
          <Stack align="center">
            <Heading>Sala não encontrada 😕</Heading>
            <Button onClick={() => router.back()}>Voltar</Button>
          </Stack>
        </Center>
      </Box>
    );
  }

  // Helper para renderizar o ícone correto baseado no nome da amenidade salva no BD
  const getAmenityIcon = (amenityName: string) => {
    const name = amenityName.toLowerCase();
    if (name.includes('wi-fi') || name.includes('internet')) return LuWifi;
    if (name.includes('tv') || name.includes('hdmi') || name.includes('monitor')) return LuMonitor;
    if (name.includes('café') || name.includes('água')) return LuCoffee;
    if (name.includes('quadro')) return LuPresentation;
    if (name.includes('videoconferência') || name.includes('video')) return LuVideo;
    if (name.includes('acessibilidade')) return LuAccessibility;
    return LuCheck; // Ícone genérico caso não dê match com nenhum
  };

  return (
    <Box minH="100vh" bg="bg.canvas">

      {/* Hero Section / Imagem de Capa */}
      <Box w="full" h={{ base: "250px", md: "400px" }} bg="gray.100" position="relative">
        {room.imageUrl ? (
          <Image 
            src={room.imageUrl} 
            alt={room.name} 
            w="full" 
            h="full" 
            objectFit="cover" 
          />
        ) : (
          <Center h="full" bg="gray.200" color="gray.500">
            Sem imagem disponível
          </Center>
        )}
        
        {/* Botão Voltar Flutuante */}
        <Box position="absolute" top={4} left={4}>
          <Button 
            size="sm" 
            variant="solid" 
            colorPalette="gray" 
            onClick={() => router.back()}
          >
            <LuArrowLeft /> Voltar
          </Button>
        </Box>
      </Box>

      <Container maxW="5xl" py={8} position="relative" top={{ base: 0, md: "-40px" }}>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          
          {/* Coluna Principal: Detalhes */}
          <Card.Root shadow="lg" borderRadius="xl" bg="white" overflow="hidden">
            <Card.Body p={{ base: 6, md: 8 }}>
              <Flex justify="space-between" align="start" mb={4}>
                <Box>
                  <Heading size="2xl" mb={2}>{room.name}</Heading>
                  <Flex gap={2} align="center">
                    <Badge size="lg" colorPalette={room.isActive ? 'green' : 'red'}>
                      {room.isActive ? 'Disponível' : 'Manutenção'}
                    </Badge>
                    <Text color="fg.muted" fontSize="sm">ID: {room.id.slice(-6)}</Text>
                  </Flex>
                </Box>
              </Flex>

              <Separator my={6} />

              <Stack gap={6}>
                <Box>
                  <Heading size="md" mb={3}>Sobre este espaço</Heading>
                  <Text fontSize="lg" color="fg.muted" lineHeight="tall">
                    {room.description || 'Nenhuma descrição detalhada fornecida para esta sala.'}
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={4}>O que este espaço oferece</Heading>
                  <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={4}>
                    
                    {/* Capacidade sempre visível, pois é obrigatória no banco */}
                    <Flex gap={3} align="center">
                      <Icon as={LuUsers} fontSize="xl" color="blue.500" />
                      <Text>Capacidade para {room.capacity} pessoas</Text>
                    </Flex>

                    {/* DEMAIS AMENIDADES GERADAS DINAMICAMENTE */}
                    {room.amenities && room.amenities.length > 0 ? (
                      room.amenities.map((amenity, index) => (
                        <Flex key={index} gap={3} align="center">
                          <Icon as={getAmenityIcon(amenity)} fontSize="xl" color="blue.500" />
                          <Text>{amenity}</Text>
                        </Flex>
                      ))
                    ) : (
                       <Text color="fg.muted" fontStyle="italic" fontSize="sm">
                         Nenhuma outra comodidade cadastrada.
                       </Text>
                    )}

                  </Grid>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Coluna Lateral: Ação de Reserva */}
          <Box>
            <Card.Root shadow="md" position="sticky" top="100px">
              <Card.Header bg="bg.subtle" borderBottomWidth="1px">
                <Heading size="md">Agendar Horário</Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap={4}>
                  <Text color="fg.muted">
                    Garanta este espaço para sua reunião. Verifique a disponibilidade e reserve instantaneamente.
                  </Text>
                  
                  <Box p={4} bg="blue.50" borderRadius="md" borderLeftWidth="4px" borderColor="blue.500">
                    <Text fontSize="sm" color="blue.700" fontWeight="medium">
                      🚀 Integração Microsoft Teams disponível nesta sala.
                    </Text>
                  </Box>

                  <Button 
                    size="xl" 
                    colorPalette="blue" 
                    width="full" 
                    onClick={() => setIsBookingOpen(true)}
                    disabled={!room.isActive}
                  >
                    <LuCalendarCheck />
                    {room.isActive ? 'Reservar Agora' : 'Indisponível'}
                  </Button>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Box>

        </Grid>
      </Container>

      {/* Modal de Agendamento */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        selectedRoom={room} 
        onSuccess={() => {
          // Aqui poderíamos mostrar um feedback extra ou redirecionar
        }} 
      />
    </Box>
  );
}