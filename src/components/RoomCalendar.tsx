'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pt } from 'date-fns/locale/pt'; // Localização em Português
import { 
  Box, Spinner, Center, Dialog, Text, Flex, Heading, Stack, Badge, Separator 
} from '@chakra-ui/react';
import { LuClock, LuDoorOpen, LuUser } from 'react-icons/lu';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuração do localizador (datas em PT)
const locales = {
  'pt': pt,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

// COMPONENTE CUSTOMIZADO PARA O BLOCO DO EVENTO
const CustomEvent = ({ event }: EventProps<BookingEvent>) => {
  // Define a cor baseada no status (Aprovada = Azul, Pendente = Laranja)
  const isPending = event.resource?.status === 'PENDING';
  const bgColor = isPending ? 'orange.400' : 'blue.500';
  const borderColor = isPending ? 'orange.600' : 'blue.700';

  return (
    <Box 
      bg={bgColor} 
      color="white" 
      h="100%" 
      w="100%" 
      borderRadius="md" 
      p={1.5} 
      borderLeft="4px solid" 
      borderLeftColor={borderColor}
      boxShadow="sm"
      _hover={{ filter: 'brightness(1.1)' }}
      transition="all 0.2s"
      overflow="hidden"
    >
      <Text fontSize="xs" fontWeight="bold" maxLines={1} lineHeight="1">
        {event.title}
      </Text>
      <Text fontSize="2xs" opacity={0.9} mt={1} maxLines={1}>
        {event.resource?.room?.name}
      </Text>
    </Box>
  );
};

export default function RoomCalendar() {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(Views.WEEK); 
  
  // Estado para o Modal de Detalhes
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) throw new Error('Falha ao carregar agendamentos');
        const data = await res.json();

        // Removemos as reservas Rejeitadas/Canceladas do calendário para limpar a visão
        const validBookings = data.filter((b: any) => b.status !== 'REJECTED' && b.status !== 'CANCELLED');

        const formattedEvents = validBookings.map((booking: any) => ({
          id: booking.id,
          title: booking.title, 
          start: new Date(booking.startTime),
          end: new Date(booking.endTime),
          resource: booking,
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <Center p={10} minH="60vh">
        <Stack align="center" gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="fg.muted">Montando calendário...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box 
      height={{ base: "700px", md: "85vh" }} // Altura adaptativa
      w="100%"
      p={{ base: 2, md: 4 }} 
      // MÁGICA: No Chakra UI V3, usamos 'css' em vez de 'sx' para estilizações profundas
      css={{
        '& .rbc-calendar': { 
          fontFamily: 'inherit',
          color: 'var(--chakra-colors-gray-800)',
        },
        /* Toolbar (Botões de Navegação) */
        '& .rbc-toolbar': { 
          flexWrap: 'wrap', 
          gap: '12px', 
          justifyContent: 'space-between',
          marginBottom: '20px'
        },
        '& .rbc-toolbar button': { 
          fontSize: { base: '12px', md: '14px' }, 
          padding: { base: '6px 12px', md: '6px 16px' },
          borderRadius: '8px',
          border: '1px solid var(--chakra-colors-gray-200)',
          backgroundColor: 'white',
          color: 'var(--chakra-colors-gray-600)',
          fontWeight: '500',
          transition: 'all 0.2s ease',
        },
        '& .rbc-toolbar button:hover': {
          backgroundColor: 'var(--chakra-colors-gray-50)',
        },
        '& .rbc-toolbar button.rbc-active': {
          backgroundColor: 'var(--chakra-colors-blue-500)',
          borderColor: 'var(--chakra-colors-blue-500)',
          color: 'white',
          boxShadow: 'var(--chakra-shadows-md)',
        },
        '& .rbc-toolbar-label': {
          fontWeight: 'bold',
          fontSize: { base: '16px', md: '20px' },
          textTransform: 'capitalize',
        },
        /* Grid do Calendário (O corpo principal) */
        '& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view': {
          borderRadius: '12px',
          border: '1px solid var(--chakra-colors-gray-200)',
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: 'var(--chakra-shadows-sm)',
        },
        '& .rbc-header': { 
          padding: '12px 4px', 
          fontWeight: '600', 
          color: 'var(--chakra-colors-gray-500)',
          borderBottom: '1px solid var(--chakra-colors-gray-200)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        },
        /* Bordas internas mais suaves */
        '& .rbc-day-bg + .rbc-day-bg, & .rbc-month-row + .rbc-month-row': {
          borderColor: 'var(--chakra-colors-gray-100)',
        },
        '& .rbc-time-content > * + * > *': {
          borderColor: 'var(--chakra-colors-gray-100)',
        },
        '& .rbc-timeslot-group': {
          borderColor: 'var(--chakra-colors-gray-100)',
        },
        '& .rbc-time-header-content': {
          borderColor: 'var(--chakra-colors-gray-200)',
        },
        /* Linha do tempo atual */
        '& .rbc-current-time-indicator': {
          backgroundColor: 'var(--chakra-colors-red-500)',
          height: '2px',
        },
        /* Dia atual (Today) */
        '& .rbc-today': { 
          backgroundColor: 'var(--chakra-colors-blue-50)',
        },
        '& .rbc-time-header .rbc-today': {
          color: 'var(--chakra-colors-blue-700)',
          backgroundColor: 'var(--chakra-colors-blue-50)',
        },
        /* Container Base do Evento (Limpamos para usar o CustomEvent) */
        '& .rbc-event': { 
          backgroundColor: 'transparent',
          padding: '0',
          border: 'none',
        },
        '& .rbc-event:focus': {
          outline: 'none'
        }
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture="pt"
        view={view}
        onView={setView} 
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "Sem eventos neste período.",
        }}
        components={{
          event: CustomEvent // Injeta nosso design premium nos blocos
        }}
        onSelectEvent={(event) => setSelectedEvent(event)} 
      />

      {/* MODAL DE DETALHES DO EVENTO (SOPHISTICATED) */}
      <Dialog.Root open={!!selectedEvent} onOpenChange={(e) => !e.open && setSelectedEvent(null)}>
        <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" shadow="2xl">
            <Dialog.CloseTrigger />
            {selectedEvent && (
              <Box p={6}>
                <Box mb={5}>
                  <Badge 
                    colorPalette={selectedEvent.resource.status === 'CONFIRMED' ? 'green' : 'yellow'} 
                    mb={3}
                    size="md"
                  >
                    {selectedEvent.resource.status === 'CONFIRMED' ? 'Aprovada' : 'Aguardando Aprovação'}
                  </Badge>
                  <Heading size="xl" lineHeight="1.2">{selectedEvent.title}</Heading>
                </Box>

                <Separator mb={5} />

                <Stack gap={4}>
                  <Flex align="center" gap={3} color="gray.600">
                    <Box p={2} bg="gray.100" borderRadius="md" color="gray.700">
                      <LuDoorOpen size={20} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Espaço</Text>
                      <Text fontWeight="medium" color="gray.800">{selectedEvent.resource?.room?.name}</Text>
                    </Box>
                  </Flex>

                  <Flex align="center" gap={3} color="gray.600">
                    <Box p={2} bg="blue.50" borderRadius="md" color="blue.600">
                      <LuClock size={20} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Horário</Text>
                      <Text fontWeight="medium" color="gray.800">
                        {format(selectedEvent.start, "dd 'de' MMMM, HH:mm", { locale: pt })} - {format(selectedEvent.end, "HH:mm")}
                      </Text>
                    </Box>
                  </Flex>

                  <Flex align="center" gap={3} color="gray.600">
                    <Box p={2} bg="purple.50" borderRadius="md" color="purple.600">
                      <LuUser size={20} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Reservado por</Text>
                      <Text fontWeight="medium" color="gray.800">
                        {selectedEvent.resource?.user?.name || selectedEvent.resource?.user?.email || 'Usuário Desconhecido'}
                      </Text>
                    </Box>
                  </Flex>
                </Stack>
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

    </Box>
  );
}