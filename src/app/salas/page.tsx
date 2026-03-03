'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Card, 
  Image, 
  Badge, 
  Button, 
  Flex, 
  Spinner, 
  Center, 
  Icon, 
  Stack 
} from '@chakra-ui/react';
import { LuUsers, LuArrowRight, LuWifi } from 'react-icons/lu';
import Navbar from '@/components/Navbar';

interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
  imageUrl?: string;
  amenities?: string[];
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) throw new Error('Falha ao buscar salas');
        const data = await res.json();
        setRooms(data);
      } catch (error) {
        console.error("Erro ao carregar as salas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return (
    <Box minH="100vh" bg="bg.canvas">
      
      <Container maxW="6xl" py={10}>
        <Stack gap={3} mb={10} textAlign="center">
          <Heading size="3xl" color="gray.800">Espaços Disponíveis</Heading>
          <Text color="fg.muted" fontSize="lg">
            Encontre e reserve a sala ideal para a sua próxima reunião ou momento de foco.
          </Text>
        </Stack>

        {loading ? (
          <Center py={20}>
            <Spinner size="xl" color="blue.500" />
          </Center>
        ) : rooms.length === 0 ? (
          <Center py={20} flexDirection="column" gap={4} bg="white" p={10} borderRadius="xl" shadow="sm">
            <Text color="fg.muted" fontSize="lg">Nenhuma sala cadastrada no momento.</Text>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {rooms.map((room) => (
              <Card.Root 
                key={room.id} 
                overflow="hidden" 
                shadow="md" 
                _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }} 
                transition="all 0.2s ease-in-out"
                bg="white"
              >
                {/* Área da Imagem */}
                <Box h="220px" bg="gray.100" position="relative">
                  {room.imageUrl ? (
                    <Image 
                      src={room.imageUrl} 
                      alt={room.name} 
                      w="full" 
                      h="full" 
                      objectFit="cover" 
                    />
                  ) : (
                    <Center h="full" color="gray.400">Sem foto disponível</Center>
                  )}
                  
                  {/* Status Tag */}
                  <Box position="absolute" top={3} left={3}>
                    <Badge size="md" colorPalette={room.isActive ? 'green' : 'red'} variant="solid" px={2} py={1} borderRadius="md">
                      {room.isActive ? 'Disponível' : 'Manutenção'}
                    </Badge>
                  </Box>

                  {/* Amenities Counter Tag */}
                  {room.amenities && room.amenities.length > 0 && (
                    <Box position="absolute" top={3} right={3}>
                      <Badge size="md" colorPalette="blue" variant="solid" px={2} py={1} borderRadius="md" display="flex" alignItems="center" gap={1}>
                        <LuWifi size={12} /> +{room.amenities.length}
                      </Badge>
                    </Box>
                  )}
                </Box>

                <Card.Body gap={4}>
                  <Heading size="xl" color="gray.800" lineClamp={1}>{room.name}</Heading>
                  
                  <Text color="fg.muted" lineClamp={2} fontSize="sm" minH="40px">
                    {room.description || 'Nenhuma descrição fornecida para este espaço.'}
                  </Text>
                  
                  <Flex align="center" gap={2} color="blue.600" fontWeight="medium" bg="blue.50" p={2} borderRadius="md" w="fit-content">
                    <Icon as={LuUsers} />
                    <Text fontSize="sm">Até {room.capacity} pessoas</Text>
                  </Flex>
                </Card.Body>

                <Card.Footer pt={0}>
                  <Button 
                    w="full" 
                    colorPalette="blue" 
                    variant={room.isActive ? "solid" : "outline"}
                    onClick={() => router.push(`/salas/${room.id}`)}
                  >
                    Ver Detalhes e Reservar <LuArrowRight />
                  </Button>
                </Card.Footer>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}