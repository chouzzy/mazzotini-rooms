'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Stack,
  Card,
  Text,
  Separator,
  Center,
  Spinner,
  Dialog,
  Badge,
  Flex,
  Icon,
  IconButton
} from '@chakra-ui/react';
import { 
  LuCalendarX, 
  LuBadgeAlert, 
  LuVideo, 
  LuCalendarClock, 
  LuMapPin,
  LuCopy
} from "react-icons/lu"; 
import { useSession } from 'next-auth/react'; 
import { toaster } from '@/components/ui/toaster';

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string; 
  onlineMeetingUrl?: string | null; 
  room: {
    name: string;
  };
}

export default function MyBookings() {
  const { data: session, status } = useSession(); 
  const [isSearched, setIsSearched] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true); 
  
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [idToConfirm, setIdToConfirm] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.user?.email) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/bookings?email=${encodeURIComponent(session.user.email)}`);
        if (!res.ok) throw new Error('Erro ao buscar agendamentos');
        
        const data = await res.json();
        
        // Opcional: Ordenar para mostrar os mais recentes/futuros primeiro
        const sortedData = data.sort((a: Booking, b: Booking) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

        setBookings(sortedData);
        setIsSearched(true);
      } catch (error) {
        toaster.create({
          title: 'Erro',
          description: 'Não foi possível carregar seus agendamentos.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBookings();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  const handleConfirmCancel = async () => {
    if (!idToConfirm) return;
    
    const id = idToConfirm;
    setCancelingId(id);
    setIdToConfirm(null);

    try {
      const res = await fetch(`/api/bookings?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Falha ao cancelar');

      toaster.create({
        title: 'Sucesso',
        description: 'Agendamento cancelado.',
        type: 'success',
      });

      // Atualiza o status localmente em vez de remover da lista para manter o histórico visível
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch (error) {
      toaster.create({
        title: 'Erro',
        description: 'Não foi possível cancelar o agendamento.',
        type: 'error',
      });
    } finally {
      setCancelingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toaster.create({ title: 'Link copiado!', type: 'success' });
    });
  };

  // Helpers de UI
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { datePart, timePart };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return { color: 'green', label: 'Aprovada', borderColor: 'green.400' };
      case 'REJECTED': return { color: 'red', label: 'Rejeitada', borderColor: 'red.400' };
      case 'CANCELLED': return { color: 'gray', label: 'Cancelada', borderColor: 'gray.400' };
      default: return { color: 'yellow', label: 'Aguardando Aprovação', borderColor: 'yellow.400' };
    }
  };

  return (
    <Flex mt={6} mb={12} flexDir={'column'} w='100%' maxW='8xl' mx='auto' px={{ base: 4, md: 6 }}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size={{ base: 'lg', md: 'xl' }} color="gray.800">
          Meus Agendamentos
        </Heading>
        {/* Você pode adicionar um botão de "Nova Reserva" aqui que manda para /salas */}
      </Flex>

      {loading && (
        <Center py={20}>
          <Spinner size="xl" color="blue.500" borderWidth="4px" />
        </Center>
      )}

      {!loading && isSearched && bookings.length === 0 && (
        <Box textAlign="center" py={16} bg="white" borderRadius="xl" borderWidth="1px" borderStyle="dashed">
          <Icon as={LuCalendarClock} fontSize="4xl" color="gray.300" mb={4} />
          <Heading size="md" color="gray.600" mb={2}>Nenhum agendamento encontrado</Heading>
          <Text color="fg.muted">Você ainda não solicitou nenhuma reserva de sala.</Text>
        </Box>
      )}

      <Flex flexDir={'column'} w='100%' gap={5}>
        {bookings.map((booking) => {
          const statusConfig = getStatusConfig(booking.status);
          const start = formatDateTime(booking.startTime);
          const end = formatDateTime(booking.endTime);
          const isInactive = booking.status === 'REJECTED' || booking.status === 'CANCELLED';

          return (
            <Card.Root 
              key={booking.id} 
              variant="elevated" 
              overflow="hidden"
              opacity={isInactive ? 0.6 : 1}
              transition="all 0.2s"
              _hover={!isInactive ? { shadow: 'md', transform: 'translateY(-2px)' } : {}}
              // Linha colorida na lateral esquerda indicando o status
              borderLeftWidth="4px"
              borderLeftColor={statusConfig.borderColor}
              bg="white"
            >
              <Card.Body p={{ base: 4, md: 6 }}>
                <Flex 
                  direction={{ base: 'column', md: 'row' }} 
                  justify="space-between" 
                  align={{ base: 'flex-start', md: 'center' }}
                  gap={6}
                >
                  {/* INFORMAÇÕES DA RESERVA */}
                  <Stack gap={3} flex="1">
                    <Flex align="center" gap={3} wrap="wrap">
                      <Heading size="md" color={isInactive ? "gray.500" : "gray.800"} textTransform={'capitalize'}>
                        {booking.title}
                      </Heading>
                      <Badge colorPalette={statusConfig.color} size="sm" px={2} py={0.5}>
                        {statusConfig.label}
                      </Badge>
                    </Flex>
                    
                    <Flex 
                      direction={{ base: 'column', sm: 'row' }} 
                      gap={{ base: 2, sm: 6 }} 
                      color="fg.muted" 
                      fontSize="sm"
                    >
                      <Flex align="center" gap={2}>
                        <Icon as={LuMapPin} />
                        <Text fontWeight="medium">{booking.room.name}</Text>
                      </Flex>
                      <Flex align="center" gap={2}>
                        <Icon as={LuCalendarClock} />
                        <Text>
                          {start.datePart} • {start.timePart} até {end.timePart}
                        </Text>
                      </Flex>
                    </Flex>
                  </Stack>

                  {/* AÇÕES (BOTÕES) */}
                  <Stack 
                    direction={{ base: 'column', sm: 'row' }} 
                    gap={3} 
                    w={{ base: 'full', md: 'auto' }}
                    align={{ base: 'stretch', md: 'center' }}
                  >
                    {/* Integração Teams Sofisticada */}
                    {booking.onlineMeetingUrl && booking.status === 'CONFIRMED' && (
                      <Flex gap={1} w={{ base: 'full', md: 'auto' }}>
                        <Button
                          as="a"
                          onClick={() => window.open(booking.onlineMeetingUrl as string, '_blank')}
                          rel="noopener noreferrer"
                          size="sm"
                          flex="1"
                          bgGradient="to-r"
                          gradientFrom="purple.600"
                          gradientTo="blue.600"
                          color="white"
                          _hover={{ gradientFrom: "purple.700", gradientTo: "blue.700" }}
                        >
                          <LuVideo /> Ingressar (Teams)
                        </Button>
                        <IconButton 
                          size="sm" 
                          variant="outline" 
                          colorPalette="purple"
                          aria-label="Copiar Link"
                          onClick={() => copyToClipboard(booking.onlineMeetingUrl!)}
                        >
                          <LuCopy />
                        </IconButton>
                      </Flex>
                    )}

                    {/* Botão Cancelar (Só aparece se a reserva não estiver morta) */}
                    {!isInactive && (
                      <Button 
                        size="sm" 
                        colorPalette="red" 
                        variant="ghost"
                        loading={cancelingId === booking.id}
                        onClick={() => setIdToConfirm(booking.id)}
                        w={{ base: 'full', md: 'auto' }}
                      >
                        <LuCalendarX /> Cancelar
                      </Button>
                    )}
                  </Stack>

                </Flex>
              </Card.Body>
            </Card.Root>
          );
        })}
      </Flex>

      {/* Dialog de Confirmação Modernizado */}
      <Dialog.Root 
        open={!!idToConfirm} 
        onOpenChange={(e) => !e.open && setIdToConfirm(null)}
      >
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" shadow="2xl">
            <Dialog.Header>
              <Flex align="center" gap={3}>
                <Box p={2} bg="red.50" color="red.500" borderRadius="full">
                  <LuBadgeAlert size={24} />
                </Box>
                <Dialog.Title fontSize="lg">Cancelar Reserva</Dialog.Title>
              </Flex>
            </Dialog.Header>
            
            <Dialog.Body pt={4} pb={6}>
              <Text color="gray.600">
                Tem a certeza que deseja cancelar este agendamento? A sala será libertada imediatamente para outros colaboradores. Esta ação não pode ser desfeita.
              </Text>
            </Dialog.Body>
            
            <Dialog.Footer bg="gray.50" borderBottomRadius="xl">
              <Button variant="ghost" onClick={() => setIdToConfirm(null)}>
                Manter Reserva
              </Button>
              <Button colorPalette="red" onClick={handleConfirmCancel}>
                Sim, Quero Cancelar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
}