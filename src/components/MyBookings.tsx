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
  LuCopy,
  LuPencil,
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
  requestedStartTime?: string | null;
  requestedEndTime?: string | null;
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

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ startTime: '', endTime: '' });

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

  const handleOpenReschedule = (booking: Booking) => {
    const formatForInput = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    setRescheduleBooking(booking);
    setRescheduleData({
      startTime: formatForInput(booking.startTime),
      endTime: formatForInput(booking.endTime),
    });
    setIsRescheduleOpen(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleBooking) return;
    if (!rescheduleData.startTime || !rescheduleData.endTime) {
      toaster.create({ title: 'Preencha os dois horários', type: 'warning' });
      return;
    }
    if (new Date(rescheduleData.endTime) <= new Date(rescheduleData.startTime)) {
      toaster.create({ title: 'O horário de término deve ser após o início', type: 'error' });
      return;
    }
    setReschedulingId(rescheduleBooking.id);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rescheduleBooking.id,
          requestedStartTime: new Date(rescheduleData.startTime).toISOString(),
          requestedEndTime: new Date(rescheduleData.endTime).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao solicitar remanejamento');
      }
      toaster.create({ title: 'Pedido enviado!', description: 'Aguardando aprovação do administrador.', type: 'success' });
      setIsRescheduleOpen(false);
      setBookings((prev) =>
        prev.map((b) => b.id === rescheduleBooking.id ? { ...b, status: 'RESCHEDULE_PENDING' } : b)
      );
    } catch (error: any) {
      toaster.create({ title: 'Erro', description: error.message, type: 'error' });
    } finally {
      setReschedulingId(null);
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
      case 'CONFIRMED': return { color: 'green', label: 'Aprovada', borderColor: 'green.500' };
      case 'REJECTED': return { color: 'red', label: 'Rejeitada', borderColor: 'red.500' };
      case 'CANCELLED': return { color: 'gray', label: 'Cancelada', borderColor: 'gray.500' };
      case 'RESCHEDULE_PENDING': return { color: 'blue', label: 'Remanejar em Análise', borderColor: 'blue.500' };
      default: return { color: 'yellow', label: 'Aguardando Aprovação', borderColor: 'yellow.500' };
    }
  };

  return (
    <Flex mb={12} flexDir={'column'} w='100%' maxW='8xl' mx='auto' px={{ base: 4, md: 6 }}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size={{ base: 'lg', md: 'xl' }} color="fg.DEFAULT">
          Meus Agendamentos
        </Heading>
        {/* Você pode adicionar um botão de "Nova Reserva" aqui que manda para /salas */}
      </Flex>

      {loading && (
        <Center py={20}>
          <Spinner size="xl" color="brand.500" borderWidth="4px" />
        </Center>
      )}

      {!loading && isSearched && bookings.length === 0 && (
        <Box textAlign="center" py={16} bg="bg.panel" borderRadius="xl" borderWidth="1px" borderColor="border.muted" borderStyle="dashed">
          <Icon as={LuCalendarClock} fontSize="4xl" color="gray.500" mb={4} />
          <Heading size="md" color="fg.DEFAULT" mb={2}>Nenhum agendamento encontrado</Heading>
          <Text color="fg.muted">Você ainda não solicitou nenhuma reserva de sala.</Text>
        </Box>
      )}

      <Flex flexDir={'column'} w='100%' gap={5}>
        {bookings.map((booking) => {
          const statusConfig = getStatusConfig(booking.status);
          const start = formatDateTime(booking.startTime);
          const end = formatDateTime(booking.endTime);
          const isInactive = booking.status === 'REJECTED' || booking.status === 'CANCELLED';
          const isReschedulePending = booking.status === 'RESCHEDULE_PENDING';

          return (
            <Card.Root 
              key={booking.id} 
              variant="outline" 
              overflow="hidden"
              opacity={isInactive ? 0.6 : 1}
              transition="all 0.2s"
              _hover={!isInactive ? { shadow: 'lg', transform: 'translateY(-2px)' } : {}}
              // Linha colorida na lateral esquerda indicando o status
              borderLeftWidth="4px"
              borderLeftColor={statusConfig.borderColor}
              bg="bg.panel"
              borderColor="brand.700"
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
                      <Heading size="md" color={isInactive ? "gray.400" : "fg.DEFAULT"} textTransform={'capitalize'}>
                        {booking.title}
                      </Heading>
                      <Badge colorPalette={statusConfig.color} size="sm" px={2} py={0.5} variant="subtle">
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
                          gradientFrom="brand.500"
                          gradientTo="brand.700"
                          color="white"
                          _hover={{ gradientFrom: "brand.400", gradientTo: "brand.600" }}
                        >
                          <LuVideo /> Ingressar (Teams)
                        </Button>
                        <IconButton 
                          size="sm" 
                          variant="outline" 
                          colorPalette="brand"
                          aria-label="Copiar Link"
                          onClick={() => copyToClipboard(booking.onlineMeetingUrl!)}
                        >
                          <LuCopy />
                        </IconButton>
                      </Flex>
                    )}

                    {/* Botão Remanejar (só para reservas CONFIRMED) */}
                    {booking.status === 'CONFIRMED' && (
                      <Button
                        size="sm"
                        colorPalette="blue"
                        variant="outline"
                        onClick={() => handleOpenReschedule(booking)}
                        w={{ base: 'full', md: 'auto' }}
                      >
                        <LuPencil /> Remanejar
                      </Button>
                    )}

                    {/* Botão Cancelar (Só aparece se a reserva não estiver morta nem em análise) */}
                    {!isInactive && !isReschedulePending && (
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="solid"
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

      {/* Modal de Remanejamento */}
      <Dialog.Root open={isRescheduleOpen} onOpenChange={(e) => !e.open && setIsRescheduleOpen(false)}>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" shadow="2xl" bg="bg.panel">
            <Dialog.Header>
              <Flex align="center" gap={3}>
                <Box p={2} bg="blue.900" color="blue.200" borderRadius="full">
                  <LuPencil size={20} />
                </Box>
                <Dialog.Title fontSize="lg" color="fg.DEFAULT">Solicitar Remanejamento</Dialog.Title>
              </Flex>
            </Dialog.Header>
            <Dialog.Body pt={4} pb={2}>
              <Text color="fg.muted" fontSize="sm" mb={4}>
                Informe o novo horário desejado para <strong>{rescheduleBooking?.title}</strong>. O pedido ficará pendente até o administrador aprovar.
              </Text>
              <Stack gap={4}>
                <Box>
                  <Text color="fg.DEFAULT" fontSize="sm" fontWeight="medium" mb={1}>Novo Início</Text>
                  <input
                    type="datetime-local"
                    value={rescheduleData.startTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, startTime: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px',
                      border: '1px solid #334155', backgroundColor: '#0f172a',
                      color: '#f1f5f9', fontSize: '14px'
                    }}
                  />
                </Box>
                <Box>
                  <Text color="fg.DEFAULT" fontSize="sm" fontWeight="medium" mb={1}>Novo Fim</Text>
                  <input
                    type="datetime-local"
                    value={rescheduleData.endTime}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, endTime: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px',
                      border: '1px solid #334155', backgroundColor: '#0f172a',
                      color: '#f1f5f9', fontSize: '14px'
                    }}
                  />
                </Box>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer bg="whiteAlpha.50" borderBottomRadius="xl" borderTopWidth="1px" borderColor="border.muted" pt={4}>
              <Button variant="ghost" color="fg.muted" onClick={() => setIsRescheduleOpen(false)}>
                Cancelar
              </Button>
              <Button
                colorPalette="blue"
                loading={reschedulingId === rescheduleBooking?.id}
                onClick={handleSubmitReschedule}
              >
                Enviar Pedido
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Dialog de Confirmação Modernizado e Adaptado para Dark Mode */}
      <Dialog.Root 
        open={!!idToConfirm} 
        onOpenChange={(e) => !e.open && setIdToConfirm(null)}
      >
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" shadow="2xl" bg="bg.panel">
            <Dialog.Header>
              <Flex align="center" gap={3}>
                <Box p={2} bg="red.900" color="red.200" borderRadius="full">
                  <LuBadgeAlert size={24} />
                </Box>
                <Dialog.Title fontSize="lg" color="fg.DEFAULT">Cancelar Reserva</Dialog.Title>
              </Flex>
            </Dialog.Header>
            
            <Dialog.Body pt={4} pb={6}>
              <Text color="fg.muted">
                Tem a certeza que deseja cancelar este agendamento? A sala será libertada imediatamente para outros colaboradores. Esta ação não pode ser desfeita.
              </Text>
            </Dialog.Body>
            
            <Dialog.Footer bg="whiteAlpha.50" borderBottomRadius="xl" borderTopWidth="1px" borderColor="border.muted">
              <Button variant="ghost" color="fg.muted" onClick={() => setIdToConfirm(null)}>
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